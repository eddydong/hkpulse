// --- Trends Table Data ---

async function fetchTrendsData() {
	try {
		const market = localStorage.getItem('selectedMarket') || 'hk';
		const url = `https://get-trends-v436pnaqfa-df.a.run.app/?market=${encodeURIComponent(market)}`;
		const resp = await fetch(url);
		if (!resp.ok) throw new Error('Network error');
		const data = await resp.json();
		return data;
	} catch (e) {
		return { error: e.message };
	}
}

function renderTrendsTable(data) {
	const trends = data.trends;
	const updateDate = data.updateDate;
	let html = `<div style="margin-bottom:8px;font-size:0.95em;color:#aaa;">Last update: ${updateDate}</div>`;
	html += `<table class="kv-table" style="width:100%;border-collapse:collapse;">`;
	html += `<thead><tr style="background:#23272a;color:#f8d47c;">`;
	html += `<th>Symbol</th><th>Name</th><th>Sector</th><th>Industry</th><th>Current Price</th><th>Target Mean</th><th>Target High</th><th>Target Low</th><th>Rec. Key</th><th>Rec. Mean</th><th>Conf. (0m)</th><th>Rec. (0m)</th><th>Conf. (-1m)</th><th>Rec. (-1m)</th><th>Conf. (-2m)</th><th>Rec. (-2m)</th><th>Conf. (-3m)</th><th>Rec. (-3m)</th>`;
	html += `</tr></thead><tbody>`;
	for (const symbol in trends) {
		const t = trends[symbol];
		html += `<tr style="background:#2c2f33;color:#e0e0e0;">`;
		html += `<td><a href="#" class="trends-symbol-link" data-symbol="${t.symbol}" data-sector="${t.sector}" data-industry="${t.industry}" style="color:#f8d47c;text-decoration:underline;">${t.symbol}</a></td>`;
		html += `<td>${t.name}</td>`;
		html += `<td>${t.sector}</td>`;
		html += `<td>${t.industry}</td>`;
		html += `<td>${t.currentPrice ?? '-'}</td>`;
		html += `<td>${t.targetMeanPrice ?? '-'}</td>`;
		html += `<td>${t.targetHighPrice ?? '-'}</td>`;
		html += `<td>${t.targetLowPrice ?? '-'}</td>`;
		html += `<td>${t.recommendationKey ?? '-'}</td>`;
		html += `<td>${t.recommendationMean ?? '-'}</td>`;
		html += `<td>${t["0mConfidence"] ?? '-'}</td>`;
		html += `<td>${t["0mRecommendation"] ?? '-'}</td>`;
		html += `<td>${t["-1mConfidence"] ?? '-'}</td>`;
		html += `<td>${t["-1mRecommendation"] ?? '-'}</td>`;
		html += `<td>${t["-2mConfidence"] ?? '-'}</td>`;
		html += `<td>${t["-2mRecommendation"] ?? '-'}</td>`;
		html += `<td>${t["-3mConfidence"] ?? '-'}</td>`;
		html += `<td>${t["-3mRecommendation"] ?? '-'}</td>`;
		html += `</tr>`;
	}
	html += `</tbody></table>`;
	return html;
}

// Show trends table when Trends tab is activated
document.addEventListener('DOMContentLoaded', () => {
	// Listen for marketChanged event to reload trends data in the background
	window.addEventListener('marketChanged', () => {
		const trendsPanel = document.getElementById('trends-panel');
		const trendsTableContainer = document.getElementById('trends-table-container');
		// Fetch new data and cache it
		fetchTrendsData().then(data => {
			if (data && !data.error) {
				cachedData = data;
				loaded = true;
				// If user is currently viewing Trends panel, update table immediately
				if (trendsPanel && trendsPanel.style.display !== 'none') {
					trendsTableContainer.innerHTML = renderTrendsTable(cachedData);
				}
			} else {
				if (trendsTableContainer && trendsPanel && trendsPanel.style.display !== 'none') {
					trendsTableContainer.innerHTML = `<div style='color:red;'>Error loading trends: ${data.error || 'Unknown error'}</div>`;
				}
			}
		});
	});
	const trendsLink = document.getElementById('trends-link');
	const trendsPanel = document.getElementById('trends-panel');
	const trendsTableContainer = document.getElementById('trends-table-container');
	let cachedData = null;
	let loaded = false;
	if (trendsTableContainer) {
		// Fetch once at page load
		trendsTableContainer.innerHTML = '<div style="color:#f8d47c;">Loading trends data...</div>';
		fetchTrendsData().then(data => {
			if (data && !data.error) {
				cachedData = data;
				loaded = true;
				// If user is already on Trends tab, render immediately
				if (trendsPanel && trendsPanel.style.display !== 'none') {
					trendsTableContainer.innerHTML = renderTrendsTable(cachedData);
				} else {
					trendsTableContainer.innerHTML = '';
				}
			} else {
				trendsTableContainer.innerHTML = `<div style='color:red;'>Error loading trends: ${data.error || 'Unknown error'}</div>`;
			}
		});
		// Show cached table when Trends tab is shown
		if (trendsLink && trendsPanel) {
			trendsLink.addEventListener('click', () => {
				if (loaded && cachedData) {
					trendsTableContainer.innerHTML = renderTrendsTable(cachedData);
					// Add click handlers for symbol links
					setTimeout(() => {
						document.querySelectorAll('.trends-symbol-link').forEach(link => {
							link.addEventListener('click', function(e) {
								e.preventDefault();
								// Switch to Financials tab
								document.querySelectorAll('#left-menu a').forEach(l => l.classList.remove('active'));
								document.getElementById('financials-link').classList.add('active');
								document.querySelectorAll('.content-panel').forEach(p => p.style.display = 'none');
								document.getElementById('financials-panel').style.display = 'block';
								// Set selectors and update options in correct order
								const sector = this.getAttribute('data-sector');
								const industry = this.getAttribute('data-industry');
								const symbol = this.getAttribute('data-symbol');
								// 1. Update sector and its options
								if (typeof populateSelectors === 'function') {
									populateSelectors(sector, '', '');
									const sectorSelect = document.getElementById('sector-select');
									if (sectorSelect) sectorSelect.value = sector;
									// 2. Update industry and its options
									populateSelectors(sector, industry, '');
									const industrySelect = document.getElementById('industry-select');
									if (industrySelect) industrySelect.value = industry;
									// 3. Update company and its options
									populateSelectors(sector, industry, symbol);
									const companySelect = document.getElementById('company-select');
									if (companySelect) companySelect.value = symbol;
								}
								// 4. Fetch data for selected company
								if (typeof fetchAndRenderForCompany === 'function') {
									fetchAndRenderForCompany(symbol);
								}
							});
						});
					}, 0);
				}
			});
		}
	}
});
