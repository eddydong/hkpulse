// stock-data.js
// Fetches stock data from the provided API and logs it to the console


// Helper to render nested objects/arrays as HTML (copied from index.html)
function renderValue(val) {
  if (val === null || val === undefined) return '-';
  if (Array.isArray(val)) {
    if (val.length === 0) return '-';
    if (val.every(v => typeof v !== 'object')) {
      return val.join(', ');
    }
    return val.map(v => renderValue(v)).join(', ');
  }
  if (typeof val === 'object') {
    let rows = Object.entries(val).map(([k, v]) => `<tr><td style='font-weight:normal;'>${k}</td><td>${renderValue(v)}</td></tr>`).join('');
    return `<table style='margin:4px 0 4px 0; border:1px solid #eee; font-size:0.97em;'><tbody>${rows}</tbody></table>`;
  }
  return val;
}

function renderStock(stockCode, stockData) {
  let html = `<div class="stock-block">`;
  html += `<div class="stock-title">${stockData.name || ''} (${stockCode})</div>`;
  html += `<div><b>Industry:</b> ${stockData.industry || ''} &nbsp; <b>Sector:</b> ${stockData.sector || ''}</div>`;
  html += `<div><b>Current Price:</b> ${stockData.financialData?.currentPrice ?? '-'} ${stockData.financialData?.financialCurrency ?? ''}</div>`;
  html += `<div><b>Recommendation:</b> ${stockData.financialData?.recommendationKey ?? '-'}</div>`;

  // Calendar Events
  if (stockData.calendarEvents) {
    html += `<h4 style=\"margin:10px 0 4px 0;\">Calendar Events</h4>`;
    html += `<table><tr><th>Event</th><th>Value</th></tr>`;
    for (const [k, v] of Object.entries(stockData.calendarEvents)) {
      html += `<tr><td>${k}</td><td>${renderValue(v)}</td></tr>`;
    }
    html += `</table>`;
  }

  // Earnings Trend
  html += `<h4 style=\"margin:10px 0 4px 0;\">Earnings Trend</h4>`;
  if (stockData.earningsTrend && Array.isArray(stockData.earningsTrend.trend)) {
    html += `<table><tr><th>Period</th><th>EPS Est.</th><th>Revenue Est.</th><th>Growth</th><th>End Date</th></tr>`;
    for (const t of stockData.earningsTrend.trend) {
      html += `<tr>`;
      html += `<td>${t.period ?? '-'}</td>`;
      html += `<td>${t.earningsEstimate?.avg ?? '-'}</td>`;
      html += `<td>${t.revenueEstimate?.avg ?? '-'}</td>`;
      html += `<td>${t.growth ?? '-'}</td>`;
      html += `<td>${t.endDate ?? '-'}</td>`;
      html += `</tr>`;
    }
    html += `</table>`;
  }

  html += `</div>`;
  return html;
}



let allStockData = {};
let tickerMeta = [];

async function fetchTickersMeta() {
  try {
    const response = await fetch('https://get-stock-tickers-v436pnaqfa-df.a.run.app/');
    if (!response.ok) throw new Error('Meta API error');
    tickerMeta = await response.json();
  } catch (e) {
    console.error('Error fetching ticker meta:', e);
    tickerMeta = [];
  }
}


function populateSelectors(selectedIndustry = '', selectedCompany = '') {
  const industrySet = new Set();
  let filteredCompanies = tickerMeta;
  for (const t of tickerMeta) {
    if (t.industry) industrySet.add(t.industry);
  }
  if (selectedIndustry) {
    filteredCompanies = tickerMeta.filter(t => t.industry === selectedIndustry);
  }
  const industrySelect = document.getElementById('industry-select');
  const companySelect = document.getElementById('company-select');
  if (industrySelect) {
    industrySelect.innerHTML = '<option value="">All</option>' +
      Array.from(industrySet).sort().map(i => `<option value="${i}"${i === selectedIndustry ? ' selected' : ''}>${i}</option>`).join('');
  }
  if (companySelect) {
    companySelect.innerHTML = '<option value="">All</option>' +
      filteredCompanies.sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.symbol}"${c.symbol === selectedCompany ? ' selected' : ''}>${c.name} (${c.symbol})</option>`).join('');
  }
}


function filterAndRender() {
  const industrySelect = document.getElementById('industry-select');
  const companySelect = document.getElementById('company-select');
  const industry = industrySelect?.value;
  const company = companySelect?.value;
  // Update company selector when industry changes
  if (document.activeElement === industrySelect) {
    populateSelectors(industry, '');
  }
  // Update industry selector when company changes
  if (document.activeElement === companySelect && company) {
    const found = tickerMeta.find(t => t.symbol === company);
    if (found && found.industry && industry !== found.industry) {
      populateSelectors(found.industry, company);
    }
  }
  const container = document.getElementById('data-container');
  if (!container) return;
  container.innerHTML = '';
  for (const [stockCode, stockData] of Object.entries(allStockData)) {
    if (industry && stockData.industry !== industry) continue;
    if (company && stockCode !== company) continue;
    container.innerHTML += renderStock(stockCode, stockData);
  }
}

async function fetchStockData() {
  try {
    await fetchTickersMeta();
    const response = await fetch('https://get-stock-data-v436pnaqfa-df.a.run.app/');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    allStockData = data;
    // Try to preselect the first available company in allStockData
    let firstCompany = '';
    let firstIndustry = '';
    const stockCodes = Object.keys(allStockData);
    if (stockCodes.length > 0) {
      firstCompany = stockCodes[0];
      const found = tickerMeta.find(t => t.symbol === firstCompany);
      if (found && found.industry) firstIndustry = found.industry;
    }
    populateSelectors(firstIndustry, firstCompany);
    filterAndRender();
    document.getElementById('industry-select')?.addEventListener('change', filterAndRender);
    document.getElementById('company-select')?.addEventListener('change', filterAndRender);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    const container = document.getElementById('data-container');
    if (container) {
      container.innerHTML = '<div style="color:red;">Error fetching stock data.</div>';
    }
  }
}

window.addEventListener('DOMContentLoaded', fetchStockData);
