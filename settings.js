// --- Market Pill Selection Logic ---
document.addEventListener('DOMContentLoaded', () => {
	// Global error handler for diagnostics
	// DEBUG: Add a fixed-position test button to body to force market selection
	// Show a warning if the settings panel is hidden
	const settingsPanel = document.getElementById('settings-panel');
	if (settingsPanel && settingsPanel.style.display === 'none') {
	}
	// No need to set selectedMarket here; app.js guarantees it exists
	let marketPillUS = document.getElementById('market-pill-us');
	let marketPillHK = document.getElementById('market-pill-hk');

	// Ensure pills exist in DOM; if not, create them inside settings-panel
	function ensureMarketPillsExist() {
		const settingsPanel = document.getElementById('settings-panel');
		if (!settingsPanel) {
			console.warn('[settings.js] settings-panel not found in DOM!');
			return;
		}
		if (!marketPillUS) {
			marketPillUS = document.createElement('button');
			marketPillUS.id = 'market-pill-us';
			marketPillUS.textContent = 'US Market';
			marketPillUS.style.margin = '8px';
			marketPillUS.style.padding = '8px 18px';
			marketPillUS.style.borderRadius = '20px';
			marketPillUS.style.border = 'none';
			marketPillUS.style.cursor = 'pointer';
			marketPillUS.style.fontWeight = 'bold';
			settingsPanel.appendChild(marketPillUS);
			console.warn('[settings.js] US pill was missing; created dynamically.');
		}
		if (!marketPillHK) {
			marketPillHK = document.createElement('button');
			marketPillHK.id = 'market-pill-hk';
			marketPillHK.textContent = 'HK Market';
			marketPillHK.style.margin = '8px';
			marketPillHK.style.padding = '8px 18px';
			marketPillHK.style.borderRadius = '20px';
			marketPillHK.style.border = 'none';
			marketPillHK.style.cursor = 'pointer';
			marketPillHK.style.fontWeight = 'bold';
			settingsPanel.appendChild(marketPillHK);
			console.warn('[settings.js] HK pill was missing; created dynamically.');
		}
	}

	ensureMarketPillsExist();

	function logPillState(where) {
		// ...no-op after cleanup
	}

	function updateMarketPills() {
		if (marketPillUS && marketPillHK) {
			marketPillUS.style.display = 'inline-block';
			marketPillHK.style.display = 'inline-block';
		}
		if (!marketPillUS || !marketPillHK) {
			console.warn('[settings.js] Market pills not found in DOM!');
			return;
		}
		// Always read latest selectedMarket from localStorage
		const currentMarket = localStorage.getItem('selectedMarket') || 'hk';
		// Restore original styles
		marketPillUS.style.background = '#23272a';
		marketPillUS.style.color = '#f8d47c';
		marketPillUS.style.border = 'none';
		marketPillUS.style.boxShadow = 'none';
		marketPillUS.style.pointerEvents = 'auto';

		marketPillHK.style.background = '#23272a';
		marketPillHK.style.color = '#f8d47c';
		marketPillHK.style.border = 'none';
		marketPillHK.style.boxShadow = 'none';
		marketPillHK.style.pointerEvents = 'auto';

		// Highlight selected pill
		if (currentMarket === 'us') {
			marketPillUS.style.background = '#f8d47c';
			marketPillUS.style.color = '#23272a';
		} else if (currentMarket === 'hk') {
			marketPillHK.style.background = '#f8d47c';
			marketPillHK.style.color = '#23272a';
		}
		logPillState('updateMarketPills');
	}

	if (marketPillUS) {
		marketPillUS.addEventListener('click', (e) => {
			localStorage.setItem('selectedMarket', 'us');
			updateMarketPills();
			window.dispatchEvent(new CustomEvent('marketChanged', { detail: { selectedMarket: 'us' } }));
		});
	}
	if (marketPillHK) {
		marketPillHK.addEventListener('click', (e) => {
			localStorage.setItem('selectedMarket', 'hk');
			updateMarketPills();
			window.dispatchEvent(new CustomEvent('marketChanged', { detail: { selectedMarket: 'hk' } }));
		});
	}

	updateMarketPills();
	logPillState('DOMContentLoaded end');
});
