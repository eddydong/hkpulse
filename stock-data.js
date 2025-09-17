// stock-data.js
// Fetches stock data from the provided API and logs it to the console

// Login functionality
window.addEventListener('DOMContentLoaded', function() {
  const loginDiv = document.getElementById('loginDiv');
  const loginForm = document.getElementById('login-form');
  
  // Function to disable/enable scrolling
  function disableScrolling() {
    document.body.style.overflow = 'hidden';
  }
  
  function enableScrolling() {
    document.body.style.overflow = '';
  }
  
  // Check if user is already logged in (has token in localStorage)
  if (localStorage.getItem('hkpulse-token')) {
    loginDiv.style.display = 'none';
    enableScrolling();
    fetchStockData();
    setupLogout();
    return;
  } else {
    // Login div is visible, disable scrolling
    disableScrolling();
  }
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('remember-me').checked;
    
    if (username && password) {
      // Save token to localStorage if "remember me" is checked
      if (rememberMe) {
        localStorage.setItem('hkpulse-token', 'logged-in-' + Date.now());
      }
      
      // Hide login div after successful login
      loginDiv.style.display = 'none';
      enableScrolling();
      // Start loading stock data
      fetchStockData();
      // Setup logout functionality
      setupLogout();
    }
  });
  
  // Logout functionality
  function setupLogout() {
    const mainLogo = document.getElementById('main-logo');
    if (mainLogo) {
      mainLogo.addEventListener('click', function() {
        // Remove token from localStorage
        localStorage.removeItem('hkpulse-token');
        // Show login div
        loginDiv.style.display = 'block';
        disableScrolling();
        // Clear form fields
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('remember-me').checked = false;
      });
    }
  }
});

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
  const displayVal = (v) => {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'object') {
      // Prefer human-readable formatting when available
      if (Object.prototype.hasOwnProperty.call(v, 'fmt') && v.fmt != null) return v.fmt;
      if (Object.prototype.hasOwnProperty.call(v, 'raw') && v.raw != null) return v.raw;
      if (Object.prototype.hasOwnProperty.call(v, 'value') && v.value != null) return v.value;
      return '-';
    }
    return v;
  };
  const bestNumber = (v) => {
    if (v === null || v === undefined) return NaN;
    if (typeof v === 'object') {
      if (Object.prototype.hasOwnProperty.call(v, 'raw') && v.raw != null) return toNumber(v.raw);
      if (Object.prototype.hasOwnProperty.call(v, 'value') && v.value != null) return toNumber(v.value);
      if (Object.prototype.hasOwnProperty.call(v, 'fmt') && v.fmt != null) return toNumber(v.fmt);
      return NaN;
    }
    return toNumber(v);
  };
  const changeClass = (today, prior) => {
    const a = bestNumber(today);
    const b = bestNumber(prior);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return '';
    if (a === b) return '';
    return a > b ? 'pos' : 'neg';
  };
  const wrapIf = (htmlVal, cls) => (cls ? `<span class="${cls}">${htmlVal}</span>` : `${htmlVal}`);
  const formatDelta = (today, prior) => {
    const a = bestNumber(today);
    const b = bestNumber(prior);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return { cls: '', html: '' };
    const diff = a - b;
    const pct = b !== 0 ? (diff / b) * 100 : undefined;
    const up = diff > 0;
    const down = diff < 0;
    const cls = up ? 'pos' : down ? 'neg' : '';
    const arrow = up ? '▲' : down ? '▼' : '';
    const pctStr = Number.isFinite(pct) ? `${pct.toFixed(2)}%` : '';
    const diffAbs = Math.abs(diff) < 1 ? diff.toFixed(4) : diff.toFixed(2);
    const diffStr = `${diff > 0 ? '+' : ''}${diffAbs}`;
    const zeroish = (pctStr === '0.00%' || pctStr === '') && (diffStr === '+0.00' || diffStr === '0.00' || diffStr === '+0.0000' || diffStr === '0.0000');
    if (!cls || zeroish) return { cls: '', html: '' };
    return { cls, html: ` <span class="${cls}">${arrow} ${pctStr}${pctStr && diffStr ? ' ' : ''}${diffStr}</span>` };
  };
  // Render any value while applying change-based coloring recursively
  const renderValueDiff = (val, prev) => {
    if (val === null || val === undefined) return '-';
    // Arrays
    if (Array.isArray(val)) {
      if (val.length === 0) return '-';
      const prevArr = Array.isArray(prev) ? prev : [];
      if (val.every(v => typeof v !== 'object')) {
        return val.map((v, i) => {
          const d = formatDelta(v, prevArr[i]);
          const valHtml = wrapIf(displayVal(v), d.cls);
          return `${valHtml}${d.html}`;
        }).join(', ');
      }
      return val.map((v, i) => renderValueDiff(v, prevArr[i])).join(', ');
    }
    // Objects -> table of key/values with their own diffs
    if (typeof val === 'object') {
      const prevObj = (prev && typeof prev === 'object') ? prev : {};
      let rows = Object.entries(val).map(([k, v]) => {
        const priorChild = Object.prototype.hasOwnProperty.call(prevObj, k) ? prevObj[k] : undefined;
        return `<tr><td style='font-weight:normal;'>${k}</td><td>${renderValueDiff(v, priorChild)}</td></tr>`;
      }).join('');
      return `<div class="table-wrap"><table class="kv-table" style='margin:4px 0 4px 0; border:1px solid #eee; font-size:0.97em;'><tbody>${rows}</tbody></table></div>`;
    }
    // Primitive -> color if changed
    const d = formatDelta(val, prev);
    const valHtml = wrapIf(displayVal(val), d.cls);
    return `${valHtml}${d.html}`;
  };
  const formatPercentish = (v) => {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'object') {
      if (Object.prototype.hasOwnProperty.call(v, 'fmt') && v.fmt != null) return String(v.fmt);
      if (Object.prototype.hasOwnProperty.call(v, 'raw') && v.raw != null) return formatPercentish(v.raw);
      if (Object.prototype.hasOwnProperty.call(v, 'value') && v.value != null) return formatPercentish(v.value);
      return '-';
    }
    if (typeof v === 'string') return v; // assume already formatted (e.g., '16.90%')
    if (typeof v === 'number' && Number.isFinite(v)) {
      const abs = Math.abs(v);
      if (abs < 1) {
        return `${(v * 100).toFixed(2)}%`;
      }
      // Looks already like percentage number; append %
      return `${v.toFixed(2)}%`;
    }
    return '-';
  };
  const pickGrowth = (t) => {
    const candidates = [t?.growth, t?.earningsEstimate?.growth, t?.revenueEstimate?.growth];
    for (const g of candidates) {
      const val = formatPercentish(g);
      if (val !== '-' && val !== '' && val !== undefined && val !== null) return val;
    }
    return '-';
  };
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
  // Color coding ONLY for today vs yesterday comparison
  let priceClass = '';
  let deltaText = '';
  if (!Number.isNaN(todayPrice) && !Number.isNaN(yestPrice)) {
    const diff = todayPrice - yestPrice;
    const pct = yestPrice !== 0 ? (diff / yestPrice) * 100 : undefined;
    const up = diff > 0;
    const down = diff < 0;
    if (up) priceClass = 'pos';
    else if (down) priceClass = 'neg';
    const arrow = up ? '▲' : down ? '▼' : '';
    const pctStr = Number.isFinite(pct) ? `${pct.toFixed(2)}%` : '';
    const diffStr = Number.isFinite(diff) ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '';
    // If both rounded values are zero-like, don't show arrow or color
    const zeroish = (pctStr === '0.00%' || pctStr === '') && (diffStr === '+0.00' || diffStr === '0.00' || diffStr === '');
    if (!zeroish) {
      const cls = priceClass || 'neutral';
      deltaText = ` <span class="${cls}">${arrow} ${pctStr}${pctStr && diffStr ? ' ' : ''}${diffStr}</span>`;
    }
  }
  const displayPrice = !Number.isNaN(todayPrice) ? todayPrice : displayVal(stockData?.financialData?.currentPrice);
  const displayCurrency = displayVal(stockData?.financialData?.financialCurrency);
  const priceSpan = priceClass ? `<span class="${priceClass}">${displayPrice}</span>` : `<span>${displayPrice}</span>`;
  html += `<div><b>Current Price:</b> ${priceSpan}${deltaText ? deltaText : ''} ${displayCurrency}</div>`;
  // Recommendation change (today vs yesterday, HK time)
  const recToday = stockData.financialData?.recommendationKey ?? '-';
  const recYest = priorData?.financialData?.recommendationKey ?? '';
  const recScale = ['strong_sell', 'sell', 'hold', 'buy', 'strong_buy'];
  const rToday = recScale.indexOf(recToday);
  const rYest = recScale.indexOf(recYest);
  let recChangeHtml = '';
  if (rToday !== -1 && rYest !== -1 && rToday !== rYest) {
    const up = rToday > rYest; // higher on scale is an upgrade
    const cls = up ? 'pos' : 'neg';
    const arrow = up ? '▲' : '▼';
    const verb = up ? 'upgrade' : 'downgrade';
    recChangeHtml = ` <span class="${cls}">${arrow} ${verb} from ${recYest}</span>`;
  }
  html += `<div><b>Recommendation:</b> ${recToday}${recChangeHtml}</div>`;

  // Calendar Events (responsive, compact)
  if (stockData.calendarEvents) {
    html += `<h4 style=\"margin:10px 0 4px 0;\">Calendar Events</h4>`;
    html += `<div class=\"events-list\">`;
    for (const [k, v] of Object.entries(stockData.calendarEvents)) {
      const isComplex = v && (Array.isArray(v) || typeof v === 'object');
      const prevVal = priorData?.calendarEvents ? priorData.calendarEvents[k] : undefined;
      if (isComplex) {
        html += `<details class=\"event-item\"><summary><span class=\"event-key\">${k}</span></summary><div class=\"event-details\">${renderValueDiff(v, prevVal)}</div></details>`;
      } else {
        const vHtml = wrapIf(displayVal(v), changeClass(v, prevVal));
        html += `<div class=\"event-row\"><div class=\"event-key\">${k}</div><div class=\"event-val\">${vHtml}</div></div>`;
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
      html += `<td>${displayVal(t.period)}</td>`;
      const priorT = priorData?.earningsTrend && Array.isArray(priorData.earningsTrend.trend)
        ? priorData.earningsTrend.trend.find(x => x.period === t.period)
        : undefined;
      {
        const d = formatDelta(t.earningsEstimate?.avg, priorT?.earningsEstimate?.avg);
        html += `<td>${wrapIf(displayVal(t.earningsEstimate?.avg), d.cls)}${d.html}</td>`;
      }
      {
        const d = formatDelta(t.revenueEstimate?.avg, priorT?.revenueEstimate?.avg);
        html += `<td>${wrapIf(displayVal(t.revenueEstimate?.avg), d.cls)}${d.html}</td>`;
      }
      {
        const growthNum = (x) => {
          const cand = [x?.growth, x?.earningsEstimate?.growth, x?.revenueEstimate?.growth];
          for (const c of cand) {
            const n = bestNumber(c);
            if (Number.isFinite(n)) return n;
          }
          return NaN;
        };
        const gNow = growthNum(t);
        const gPrev = growthNum(priorT || {});
        const d = formatDelta(gNow, gPrev);
        html += `<td>${wrapIf(pickGrowth(t), d.cls)}${d.html}</td>`;
      }
      html += `<td>${displayVal(t.endDate)}</td>`;
      html += `</tr>`;
    }
    html += `</table>`;
  }

  // Financial Data (primitive fields only)
  if (stockData.financialData && typeof stockData.financialData === 'object') {
    html += `<h4 style=\"margin:10px 0 4px 0;\">Financial Data</h4>`;
    const entries = Object.entries(stockData.financialData).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v !== 'object') return true;
      // Include simple objects with fmt/raw/value, exclude complex nested objects/arrays
      return (
        (Object.prototype.hasOwnProperty.call(v, 'fmt') && v.fmt != null) ||
        (Object.prototype.hasOwnProperty.call(v, 'raw') && v.raw != null) ||
        (Object.prototype.hasOwnProperty.call(v, 'value') && v.value != null)
      );
    });
    if (entries.length) {
      html += `<div class=\"table-wrap\"><table class=\"kv-table\"><tbody>`;
      for (const [k, v] of entries) {
        const priorV = priorData?.financialData ? priorData.financialData[k] : undefined;
        let cls = '';
        let deltaHtml = '';
        if (k === 'currentPrice' || k === 'regularMarketPrice') {
          // Align with header values
          cls = deltaText ? (priceClass || '') : '';
          deltaHtml = deltaText ? `${deltaText}` : '';
        } else {
          const d = formatDelta(v, priorV);
          cls = d.cls;
          deltaHtml = d.html;
        }
        const valHtml = wrapIf(displayVal(v), cls);
        html += `<tr><td style='font-weight:normal;'>${k}</td><td>${valHtml}${deltaHtml}</td></tr>`;
      }
      html += `</tbody></table></div>`;
    }
  }

  // Recommendation Trend
  if (stockData.recommendationTrend && Array.isArray(stockData.recommendationTrend.trend)) {
    html += `<h4 style=\"margin:10px 0 4px 0;\">Recommendation Trend</h4>`;
    html += `<div class=\"table-wrap\"><table><thead><tr><th>Period</th><th>Strong Buy</th><th>Buy</th><th>Hold</th><th>Sell</th><th>Strong Sell</th></tr></thead><tbody>`;
    for (const t of stockData.recommendationTrend.trend) {
      html += `<tr>`;
      const priorT = priorData?.recommendationTrend && Array.isArray(priorData.recommendationTrend.trend)
        ? priorData.recommendationTrend.trend.find(x => x.period === t.period)
        : undefined;
  html += `<td>${displayVal(t.period)}</td>`;
  { const d = formatDelta(t.strongBuy, priorT?.strongBuy); html += `<td>${wrapIf(displayVal(t.strongBuy), d.cls)}${d.html}</td>`; }
  { const d = formatDelta(t.buy, priorT?.buy); html += `<td>${wrapIf(displayVal(t.buy), d.cls)}${d.html}</td>`; }
  { const d = formatDelta(t.hold, priorT?.hold); html += `<td>${wrapIf(displayVal(t.hold), d.cls)}${d.html}</td>`; }
  { const d = formatDelta(t.sell, priorT?.sell); html += `<td>${wrapIf(displayVal(t.sell), d.cls)}${d.html}</td>`; }
  { const d = formatDelta(t.strongSell, priorT?.strongSell); html += `<td>${wrapIf(displayVal(t.strongSell), d.cls)}${d.html}</td>`; }
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;
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


function populateSelectors(selectedSector = '', selectedIndustry = '', selectedCompany = '') {
  // Populate dropdowns without any 'All' placeholder options
  if (!Array.isArray(tickerMeta)) tickerMeta = [];
  
  const sectorSet = new Set();
  const industrySet = new Set();
  
  for (const t of tickerMeta) {
    if (t.sector) sectorSet.add(t.sector);
  }

  let filteredBySector = tickerMeta;
  if (selectedSector) {
    filteredBySector = tickerMeta.filter(t => t.sector === selectedSector);
  }

  for (const t of filteredBySector) {
    if (t.industry) industrySet.add(t.industry);
  }

  let filteredCompanies = filteredBySector;
  if (selectedIndustry) {
    filteredCompanies = filteredBySector.filter(t => t.industry === selectedIndustry);
  }

  const sectorSelect = document.getElementById('sector-select');
  const industrySelect = document.getElementById('industry-select');
  const companySelect = document.getElementById('company-select');

  if (sectorSelect) {
    sectorSelect.innerHTML = Array.from(sectorSet)
      .sort()
      .map(s => `<option value="${s}"${s === selectedSector ? ' selected' : ''}>${s}</option>`)
      .join('');
  }

  if (industrySelect) {
    industrySelect.innerHTML = Array.from(industrySet)
      .sort()
      .map(i => `<option value="${i}"${i === selectedIndustry ? ' selected' : ''}>${i}</option>`)
      .join('');
  }

  if (companySelect) {
    companySelect.innerHTML = filteredCompanies
      .sort((a, b) => (a.name || a.symbol).localeCompare(b.name || b.symbol))
      .map(c => `<option value="${c.symbol}"${c.symbol === selectedCompany ? ' selected' : ''}>${c.name || c.symbol} (${c.symbol})</option>`)
      .join('');
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
  const sectorSelect = document.getElementById('sector-select');
  const industrySelect = document.getElementById('industry-select');
  const companySelect = document.getElementById('company-select');
  let sector = sectorSelect?.value;
  let industry = industrySelect?.value;
  let company = companySelect?.value;

  const activeElement = document.activeElement;

  if (activeElement === sectorSelect) {
    populateSelectors(sector, '', '');
    const firstIndustryOption = industrySelect && industrySelect.options.length > 0 ? industrySelect.options[0].value : '';
    industrySelect.value = firstIndustryOption;
    industry = firstIndustryOption;
    populateSelectors(sector, industry, '');
    const firstCompanyOption = companySelect && companySelect.options.length > 0 ? companySelect.options[0].value : '';
    companySelect.value = firstCompanyOption;
    company = firstCompanyOption;
  } else if (activeElement === industrySelect) {
    populateSelectors(sector, industry, '');
    const firstCompanyOption = companySelect && companySelect.options.length > 0 ? companySelect.options[0].value : '';
    companySelect.value = firstCompanyOption;
    company = firstCompanyOption;
  } else if (activeElement === companySelect) {
    const found = tickerMeta.find(t => t.symbol === company);
    if (found) {
      if (found.sector && sector !== found.sector) {
        sector = found.sector;
      }
      if (found.industry && industry !== found.industry) {
        industry = found.industry;
      }
      populateSelectors(sector, industry, company);
    }
  }

  // Save selection to localStorage
  localStorage.setItem('selectedSector', sector || '');
  localStorage.setItem('selectedIndustry', industry || '');
  localStorage.setItem('selectedCompany', company || '');

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
    
    // Try to restore previous selection from localStorage
    let firstSector = localStorage.getItem('selectedSector') || '';
    let firstIndustry = localStorage.getItem('selectedIndustry') || '';
    let firstCompany = localStorage.getItem('selectedCompany') || '';

    const sectors = Array.from(new Set(tickerMeta.map(t => t.sector).filter(Boolean))).sort();
    if (!firstSector && sectors.length > 0) {
      firstSector = sectors[0];
    }

    let filteredBySector = tickerMeta;
    if (firstSector) {
      filteredBySector = tickerMeta.filter(t => t.sector === firstSector);
    }

    const industries = Array.from(new Set(filteredBySector.map(t => t.industry).filter(Boolean))).sort();
    if (!firstIndustry && industries.length > 0) {
      firstIndustry = industries[0];
    }

    let filteredCompanies = filteredBySector;
    if (firstIndustry) {
      filteredCompanies = filteredBySector.filter(t => t.industry === firstIndustry);
    }

    if (!firstCompany && filteredCompanies.length > 0) {
      filteredCompanies.sort((a, b) => (a.name || a.symbol).localeCompare(b.name || b.symbol));
      firstCompany = filteredCompanies[0].symbol;
    }

    populateSelectors(firstSector, firstIndustry, firstCompany);

    await fetchAndRenderForCompany(firstCompany);
    document.getElementById('sector-select')?.addEventListener('change', filterAndRender);
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
