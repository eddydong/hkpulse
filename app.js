// --- App-level logic: login/logout, scrolling, loginDiv control ---
// Ensure selectedMarket is always set in localStorage at startup (runs immediately)
if (!localStorage.getItem('selectedMarket')) {
	localStorage.setItem('selectedMarket', 'hk');
	console.log('selectedMarket initialized to hk');
} else {
	console.log('selectedMarket already set:', localStorage.getItem('selectedMarket'));
}
document.addEventListener('DOMContentLoaded', () => {
	const loginDiv = document.getElementById('loginDiv');
	const loginForm = document.getElementById('login-form');

	function setLoginDivHeight() {
		const windowHeight = window.innerHeight;
		const screenHeight = screen.height;
		const documentHeight = document.documentElement.scrollHeight;
		const maxHeight = Math.max(windowHeight, screenHeight, documentHeight, 1200);
		loginDiv.style.height = (maxHeight + 200) + 'px';
		loginDiv.style.top = '-100px';
		loginDiv.style.left = '-100px';
		loginDiv.style.width = 'calc(100vw + 200px)';
		loginDiv.querySelector('div').style.minHeight = (maxHeight + 200) + 'px';
		loginDiv.querySelector('div').style.paddingTop = '150px';
	}

	function disableScrolling() {
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';
		document.body.style.position = 'fixed';
		document.body.style.width = '100%';
	}
	function enableScrolling() {
		document.body.style.overflow = '';
		document.documentElement.style.overflow = '';
		document.body.style.position = '';
		document.body.style.width = '';
	}

	setLoginDivHeight();
	window.addEventListener('resize', setLoginDivHeight);
	window.addEventListener('orientationchange', function() {
		setTimeout(setLoginDivHeight, 200);
	});

	// Check if user is already logged in (has token in localStorage)
	async function tryTokenLogin() {
		const token = localStorage.getItem('hkpulse-token');
		if (token) {
			try {
				console.log('[LOGIN] POST https://token-login-v436pnaqfa-df.a.run.app', { token });
				const resp = await fetch('https://token-login-v436pnaqfa-df.a.run.app', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token })
				});
				const data = await resp.json();
				console.log('[LOGIN] Response:', resp.status, data);
				if (resp.ok && !data.error) {
					loginDiv.classList.add('hidden');
					enableScrolling();
					if (typeof fetchStockData === 'function') fetchStockData();
					// Do NOT call setupLogout() here
					return;
				} else {
					// Invalid token, remove and show login
					localStorage.removeItem('hkpulse-token');
				}
			} catch (err) {
				console.log('[LOGIN] Token login error:', err);
				localStorage.removeItem('hkpulse-token');
			}
		}
		// No valid token, show login panel
		disableScrolling();
		loginDiv.classList.remove('hidden');
	}
	tryTokenLogin();

	const usernameInput = document.getElementById('username');
	const otpInput = document.getElementById('otp-input');
	const loginBtn = document.getElementById('login-btn');
	let otpStep = false;

	loginForm.addEventListener('submit', async function(e) {
		e.preventDefault();
		if (!otpStep) {
			// Step 1: Send OTP (POST)
			const email = usernameInput.value.trim();
			if (!email) {
				alert('Please enter your email.');
				return;
			}
			try {
				loginBtn.disabled = true;
				loginBtn.textContent = 'Sending...';
				console.log('[LOGIN] POST https://request-login-code-v436pnaqfa-df.a.run.app', { email });
				const reqResp = await fetch('https://request-login-code-v436pnaqfa-df.a.run.app', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email })
				});
				const reqData = await reqResp.json();
				console.log('[LOGIN] Response:', reqResp.status, reqData);
				if (!reqResp.ok || reqData.error) {
					alert('Error requesting login code: ' + (reqData.error || reqResp.status));
					loginBtn.disabled = false;
					loginBtn.textContent = 'Send OTP';
					return;
				}
				// Step 2: Show OTP input
				usernameInput.style.display = 'none';
				otpInput.style.display = '';
				loginBtn.textContent = 'Enter';
				loginBtn.disabled = false;
				otpStep = true;
				otpInput.focus();
			} catch (err) {
				console.log('[LOGIN] Request OTP error:', err);
				alert('Login failed: ' + err.message);
				loginBtn.disabled = false;
				loginBtn.textContent = 'Send OTP';
			}
		} else {
			// Step 3: Verify OTP (POST)
			const email = usernameInput.value.trim();
			const otp = otpInput.value.trim();
			if (!otp) {
				alert('OTP is required.');
				return;
			}
			try {
				loginBtn.disabled = true;
				loginBtn.textContent = 'Verifying...';
				console.log('[LOGIN] POST https://verify-login-code-v436pnaqfa-df.a.run.app', { email, otp });
				const verifyResp = await fetch('https://verify-login-code-v436pnaqfa-df.a.run.app', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, otp })
				});
				const verifyData = await verifyResp.json();
				console.log('[LOGIN] Response:', verifyResp.status, verifyData);
				if (!verifyResp.ok || verifyData.error || !verifyData.token) {
					alert('Error verifying OTP: ' + (verifyData.error || verifyResp.status));
					loginBtn.disabled = false;
					loginBtn.textContent = 'Enter';
					return;
				}
				const token = verifyData.token;
				// Step 4: Finalize login with token (POST)
				console.log('[LOGIN] POST https://token-login-v436pnaqfa-df.a.run.app', { token });
				const tokenResp = await fetch('https://token-login-v436pnaqfa-df.a.run.app', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token })
				});
				const tokenData = await tokenResp.json();
				console.log('[LOGIN] Response:', tokenResp.status, tokenData);
				if (!tokenResp.ok || tokenData.error) {
					alert('Error finalizing login: ' + (tokenData.error || tokenResp.status));
					loginBtn.disabled = false;
					loginBtn.textContent = 'Enter';
					return;
				}
				// Step 5: Store token and proceed
				localStorage.setItem('hkpulse-token', token);
				loginDiv.classList.add('hidden');
				enableScrolling();
				if (typeof fetchStockData === 'function') fetchStockData();
				// Do NOT call setupLogout() here
			} catch (err) {
				console.log('[LOGIN] Verify OTP or token login error:', err);
				alert('Login failed: ' + err.message);
				loginBtn.disabled = false;
				loginBtn.textContent = 'Enter';
			}
		}
	});

	function setupLogout() {
		// Only call logout API when user explicitly logs out
		// This function should only be called by the logout button handler
		const token = localStorage.getItem('hkpulse-token');
		if (token) {
			console.log('[LOGOUT] POST https://logout-v436pnaqfa-df.a.run.app', { token });
			fetch('https://logout-v436pnaqfa-df.a.run.app', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			})
			.then(resp => resp.json().then(data => {
				console.log('[LOGOUT] Response:', resp.status, data);
			}))
			.catch(err => {
				console.log('[LOGOUT] Error:', err);
			});
		}
	}
	// --- Menu and logout logic ---
	const menuLinks = document.querySelectorAll('#left-menu a');
	const contentPanels = document.querySelectorAll('.content-panel');

	// Hide all panels and deactivate all links
	menuLinks.forEach(l => l.classList.remove('active'));
	contentPanels.forEach(p => p.style.display = 'none');

	// Restore last tab from localStorage, default to Trends
	const lastTabId = localStorage.getItem('activeTabId') || 'trends-link';
	const lastPanelId = lastTabId.replace('-link', '-panel');
	const lastLink = document.getElementById(lastTabId);
	const lastPanel = document.getElementById(lastPanelId);
	if (lastLink) lastLink.classList.add('active');
	if (lastPanel) lastPanel.style.display = 'block';

	// Add logout to button
	const logoutBtn = document.getElementById('logout-btn');
	if (logoutBtn) {
		logoutBtn.onclick = function() {
			setupLogout(); // Only call logout API here
			localStorage.removeItem('hkpulse-token');
			document.getElementById('loginDiv').classList.remove('hidden');
			document.getElementById('main-content').style.display = 'none';
			// Reset login form UI
			if (usernameInput) {
				usernameInput.style.display = '';
				usernameInput.value = '';
			}
			if (otpInput) {
				otpInput.style.display = 'none';
				otpInput.value = '';
			}
			if (loginBtn) {
				loginBtn.textContent = 'Send OTP';
				loginBtn.disabled = false;
			}
			otpStep = false;
		};
	}

	menuLinks.forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();

			// Deactivate all links
			menuLinks.forEach(l => l.classList.remove('active'));
			// Hide all panels
			contentPanels.forEach(p => p.style.display = 'none');

			// Activate the clicked link
			link.classList.add('active');

			// Show the corresponding panel
			const panelId = link.id.replace('-link', '-panel');
			const panel = document.getElementById(panelId);
			if (panel) {
				panel.style.display = 'block';
			}
			// Save active tab to localStorage
			localStorage.setItem('activeTabId', link.id);
		});
	});
});
