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

async function fetchStockData() {
  try {
    const response = await fetch('https://get-stock-data-v436pnaqfa-df.a.run.app/');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const container = document.getElementById('data-container');
    if (!container) return;
    container.innerHTML = '';
    for (const [stockCode, stockData] of Object.entries(data)) {
      container.innerHTML += renderStock(stockCode, stockData);
    }
  } catch (error) {
    console.error('Error fetching stock data:', error);
    const container = document.getElementById('data-container');
    if (container) {
      container.innerHTML = '<div style="color:red;">Error fetching stock data.</div>';
    }
  }
}

window.addEventListener('DOMContentLoaded', fetchStockData);
