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
	if (localStorage.getItem('hkpulse-token')) {
		loginDiv.classList.add('hidden');
		enableScrolling();
		if (typeof fetchStockData === 'function') fetchStockData();
		setupLogout();
	} else {
		disableScrolling();
	}

	loginForm.addEventListener('submit', function(e) {
		e.preventDefault();
		const username = document.getElementById('username').value.trim();
		const password = document.getElementById('password').value.trim();
		const rememberMe = document.getElementById('remember-me').checked;
		if (username && password) {
			if (rememberMe) {
				localStorage.setItem('hkpulse-token', 'logged-in-' + Date.now());
			}
			loginDiv.classList.add('hidden');
			enableScrolling();
			if (typeof fetchStockData === 'function') fetchStockData();
			setupLogout();
		}
	});

	function setupLogout() {
		// Logout from logo removed
	}
});
			document.addEventListener('DOMContentLoaded', () => {
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
						localStorage.removeItem('hkpulse-token');
						document.getElementById('loginDiv').classList.remove('hidden');
						document.getElementById('main-content').style.display = 'none';
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
