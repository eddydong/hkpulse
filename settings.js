// --- Market Pill Selection Logic ---
document.addEventListener('DOMContentLoaded', () => {
	let selectedMarket = localStorage.getItem('selectedMarket') || 'hk';
	const marketPillUS = document.getElementById('market-pill-us');
	const marketPillUK = document.getElementById('market-pill-uk');
	function updateMarketPills() {
		if (!marketPillUS || !marketPillUK) return;
		if (selectedMarket === 'us') {
			marketPillUS.style.background = '#f8d47c';
			marketPillUS.style.color = '#23272a';
			marketPillUK.style.background = '#23272a';
			marketPillUK.style.color = '#f8d47c';
		} else if (selectedMarket === 'uk') {
			marketPillUK.style.background = '#f8d47c';
			marketPillUK.style.color = '#23272a';
			marketPillUS.style.background = '#23272a';
			marketPillUS.style.color = '#f8d47c';
		} else {
			// Default: none selected, fallback to HK (no pill)
			marketPillUS.style.background = '#23272a';
			marketPillUS.style.color = '#f8d47c';
			marketPillUK.style.background = '#23272a';
			marketPillUK.style.color = '#f8d47c';
		}
	}
	if (marketPillUS) {
		marketPillUS.addEventListener('click', () => {
			selectedMarket = 'us';
			localStorage.setItem('selectedMarket', selectedMarket);
			updateMarketPills();
		});
	}
	if (marketPillUK) {
		marketPillUK.addEventListener('click', () => {
			selectedMarket = 'uk';
			localStorage.setItem('selectedMarket', selectedMarket);
			updateMarketPills();
		});
	}
	updateMarketPills();
});
