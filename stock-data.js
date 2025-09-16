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
      return `<div class="table-wrap"><table class="kv-table" style='margin:4px 0 4px 0; border:1px solid #eee; font-size:0.97em;'><tbody>${rows}</tbody></table></div>`;
  }
  return val;
}

function renderStock(stockCode, stockData, priorData) {
  let html = `<div class="stock-block">`;
  html += `<div class="stock-title">${stockData.name || ''} (${stockCode})</div>`;
  html += `<div><b>Industry:</b> ${stockData.industry || ''} &nbsp; <b>Sector:</b> ${stockData.sector || ''}</div>`;
  const toNumber = (v) => {
    if (v === null || v === undefined) return NaN;
    const s = String(v).replace(/,/g, '');
    const n = parseFloat(s.replace(/[^0-9+\-\.Ee]/g, ''));
    return Number.isNaN(n) ? NaN : n;
  };
  const firstNumber = (...vals) => {
    for (const v of vals) {
      const n = toNumber(v);
      if (!Number.isNaN(n)) return n;
    }
    return NaN;
  };
  // Resolve prices from several possible fields for robustness
  const todayPrice = firstNumber(
    stockData?.financialData?.currentPrice,
    stockData?.financialData?.regularMarketPrice,
    stockData?.price?.regularMarketPrice,
    stockData?.summaryDetail?.regularMarketPrice
  );
  const yestPrice = firstNumber(
    priorData?.financialData?.currentPrice,
    priorData?.financialData?.regularMarketPrice,
    priorData?.price?.regularMarketPrice,
    priorData?.summaryDetail?.regularMarketPrice
  );
  let priceColor = '';
  let deltaText = '';
  if (!Number.isNaN(todayPrice) && !Number.isNaN(yestPrice)) {
    const diff = todayPrice - yestPrice;
    const up = diff > 0;
    const down = diff < 0;
    const pct = yestPrice !== 0 ? (diff / yestPrice) * 100 : undefined;
    if (up) priceColor = 'style="color:#4caf50"';
    else if (down) priceColor = 'style="color:#e57373"';
    const arrow = up ? '▲' : down ? '▼' : '';
    const pctStr = typeof pct === 'number' && Number.isFinite(pct) ? `${pct.toFixed(2)}%` : '';
    const diffStr = Number.isFinite(diff) ? `${diff > 0 ? '+' : diff < 0 ? '' : ''}${diff.toFixed(2)}` : '';
    if (arrow || pctStr || diffStr) {
      deltaText = ` <span ${priceColor}>${arrow} ${pctStr}${pctStr && diffStr ? ' ' : ''}${diffStr}</span>`;
    }
  }
  const displayPrice = stockData?.financialData?.currentPrice ?? todayPrice ?? '-';
  html += `<div><b>Current Price:</b> <span ${priceColor}>${displayPrice}</span>${deltaText ? deltaText : ''} ${stockData.financialData?.financialCurrency ?? ''}</div>`;
  html += `<div><b>Recommendation:</b> ${stockData.financialData?.recommendationKey ?? '-'}</div>`;

  // Calendar Events (responsive, compact)
  if (stockData.calendarEvents) {
    html += `<h4 style=\"margin:10px 0 4px 0;\">Calendar Events</h4>`;
    html += `<div class=\"events-list\">`;
    for (const [k, v] of Object.entries(stockData.calendarEvents)) {
      const isComplex = v && (Array.isArray(v) || typeof v === 'object');
      if (isComplex) {
        html += `<details class=\"event-item\"><summary><span class=\"event-key\">${k}</span></summary><div class=\"event-details\">${renderValue(v)}</div></details>`;
      } else {
        html += `<div class=\"event-row\"><div class=\"event-key\">${k}</div><div class=\"event-val\">${renderValue(v)}</div></div>`;
      }
    }
    html += `</div>`;
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
let currentSymbol = '';
let currentStart = '';
let currentEnd = '';
const HK_TZ = 'Asia/Hong_Kong';

function ymdInTZ(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function setDefaultDates() {
  // Use Hong Kong time: end = today(HK), start = end - 1 day (HK)
  const now = new Date();
  const end = now;
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  currentStart = ymdInTZ(start, HK_TZ);
  currentEnd = ymdInTZ(end, HK_TZ);
}

function buildDataUrl(symbols, start = currentStart, end = currentEnd) {
  const base = 'https://get-stock-data-v436pnaqfa-df.a.run.app/';
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (symbols && symbols.length) params.set('symbols', Array.isArray(symbols) ? symbols.join(',') : symbols);
  return `${base}?${params.toString()}`;
}

// Extract symbol payload from API response, supporting both legacy and new date-keyed formats
function extractSymbolData(json, symbol) {
  if (!json || !symbol) return undefined;
  if (json[symbol]) return json[symbol];
  const keys = Object.keys(json);
  if (keys.length && keys.every(k => /\d{4}-\d{2}-\d{2}/.test(k))) {
    // date-keyed; pick most recent date
    const latest = keys.sort().reverse()[0];
    const day = json[latest];
    if (day && day[symbol]) return day[symbol];
  }
  // Fallback: scan nested objects
  for (const val of Object.values(json)) {
    if (val && typeof val === 'object' && val[symbol]) return val[symbol];
  }
  return undefined;
}

function extractSymbolByDate(json, date, symbol) {
  if (!json || !date || !symbol) return undefined;
  const day = json[date];
  if (day && typeof day === 'object') return day[symbol];
  return undefined;
}

function getLatestTwoDates(json, symbol) {
  if (!json || typeof json !== 'object') return [];
  const keys = Object.keys(json)
    .filter(k => /\d{4}-\d{2}-\d{2}/.test(k))
    .sort();
  if (keys.length === 0) return [];
  // Walk from newest to oldest and collect the first two dates that contain the symbol
  const found = [];
  for (let i = keys.length - 1; i >= 0; i--) {
    const d = keys[i];
    const day = json[d];
    if (day && typeof day === 'object' && day[symbol]) {
      found.push(d);
      if (found.length === 2) break;
    }
  }
  return found;
}

async function fetchTickersMeta() {
  try {
    const response = await fetch('https://get-stock-tickers-v436pnaqfa-df.a.run.app/');
    if (!response.ok) throw new Error('Meta API error');
    const raw = await response.json();
    // Normalize to array: API currently returns an object keyed by symbol
    if (Array.isArray(raw)) {
      tickerMeta = raw;
    } else if (raw && typeof raw === 'object') {
      tickerMeta = Object.entries(raw).map(([symbol, info]) => ({ symbol, ...info }));
    } else {
      tickerMeta = [];
    }
  } catch (e) {
    console.error('Error fetching ticker meta:', e);
    tickerMeta = [];
  }
}


function populateSelectors(selectedIndustry = '', selectedCompany = '') {
// Note: single, deduplicated definition
  if (!Array.isArray(tickerMeta)) tickerMeta = [];
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


async function fetchAndRenderForCompany(symbol) {
  const container = document.getElementById('data-container');
  if (!symbol) {
    if (container) container.innerHTML = '';
    return;
  }
  try {
    // Recompute dates each time to ensure end=today(HK), start=yesterday(HK)
    setDefaultDates();
    const url = buildDataUrl(symbol);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Network response was not ok');
  const data = await resp.json();
  // Always use absolute HKT dates: today = currentEnd, yesterday = currentStart
  const todayPayload = extractSymbolByDate(data, currentEnd, symbol);
  const yestPayload = extractSymbolByDate(data, currentStart, symbol);
  allStockData = todayPayload ? { [symbol]: todayPayload } : {};
  currentSymbol = symbol;
    if (container) {
      container.innerHTML = '';
      const stockData = allStockData[symbol];
      if (stockData) {
        container.innerHTML = renderStock(symbol, stockData, yestPayload);
      } else {
        container.innerHTML = '<div style="color:#f8d47c;">No data for selected company.</div>';
      }
    }
  } catch (e) {
    console.error('Error fetching stock data:', e);
    if (container) container.innerHTML = '<div style="color:red;">Error fetching stock data.</div>';
  }
}

function filterAndRender() {
  const industrySelect = document.getElementById('industry-select');
  const companySelect = document.getElementById('company-select');
  let industry = industrySelect?.value;
  let company = companySelect?.value;

  // If industry changed, update company selector and auto-select the first company in that industry
  if (document.activeElement === industrySelect) {
    populateSelectors(industry, '');
    // Auto-select first company in filtered list
    const firstOption = companySelect && companySelect.options.length > 1 ? companySelect.options[1].value : '';
    if (firstOption) {
      companySelect.value = firstOption;
      company = firstOption;
    } else {
      companySelect.value = '';
      company = '';
    }
  }

  // If company changed, update industry selector to match
  if (document.activeElement === companySelect && company) {
    const found = tickerMeta.find(t => t.symbol === company);
    if (found && found.industry && industry !== found.industry) {
      populateSelectors(found.industry, company);
      industry = found.industry;
    }
  }

  // Always fetch for the selected company to keep comparison accurate
  if (company) {
    fetchAndRenderForCompany(company);
  } else {
    const container = document.getElementById('data-container');
    if (container) container.innerHTML = '';
  }
}



async function fetchStockData() {
  try {
    setDefaultDates();
    await fetchTickersMeta();
    // Step 1: Select first industry
    let firstIndustry = '';
    let firstCompany = '';
    if (tickerMeta.length > 0) {
      firstIndustry = tickerMeta[0].industry || '';
    }
    // Step 2: Filter companies in that industry
    let filteredCompanies = tickerMeta;
    if (firstIndustry) {
      filteredCompanies = tickerMeta.filter(t => t.industry === firstIndustry);
    }
    // Step 3: Select first company in that industry
    if (filteredCompanies.length > 0) {
      firstCompany = filteredCompanies[0].symbol;
    }
    // Step 4: Populate selectors with these defaults
    populateSelectors(firstIndustry, firstCompany);

    // Step 5: Fetch only the selected company's data using params
    await fetchAndRenderForCompany(firstCompany);
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
