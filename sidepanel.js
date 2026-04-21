const OFFICE_CURRENCIES = [
  { code:'GBP', flag:'🇬🇧', name:'British Pound',  symbol:'£',  office:'United Kingdom' },
  { code:'EUR', flag:'🇪🇺', name:'Euro',            symbol:'€',  office:'Brussels'       },
  { code:'BRL', flag:'🇧🇷', name:'Brazilian Real',  symbol:'R$', office:'Brazil'         },
  { code:'CNY', flag:'🇨🇳', name:'Chinese Yuan',    symbol:'¥',  office:'Beijing'        },
  { code:'USD', flag:'🇺🇸', name:'US Dollar',       symbol:'$',  office:'New York', fullWidth:true },
];

const WORLD_CURRENCIES = [
  ['US Dollar','USD','$'],['Euro','EUR','€'],['British Pound','GBP','£'],
  ['Japanese Yen','JPY','¥'],['Swiss Franc','CHF','Fr'],['Canadian Dollar','CAD','$'],
  ['Australian Dollar','AUD','$'],['Chinese Yuan','CNY','¥'],['Hong Kong Dollar','HKD','$'],
  ['Singapore Dollar','SGD','$'],['Swedish Krona','SEK','kr'],['Norwegian Krone','NOK','kr'],
  ['Danish Krone','DKK','kr'],['New Zealand Dollar','NZD','$'],['Mexican Peso','MXN','$'],
  ['Brazilian Real','BRL','R$'],['Indian Rupee','INR','₹'],['South Korean Won','KRW','₩'],
  ['South African Rand','ZAR','R'],['Turkish Lira','TRY','₺'],['Russian Ruble','RUB','₽'],
  ['Polish Zloty','PLN','zł'],['Czech Koruna','CZK','Kč'],['Hungarian Forint','HUF','Ft'],
  ['Romanian Leu','RON','lei'],['Israeli Shekel','ILS','₪'],['Saudi Riyal','SAR','﷼'],
  ['UAE Dirham','AED','د.إ'],['Thai Baht','THB','฿'],['Malaysian Ringgit','MYR','RM'],
  ['Indonesian Rupiah','IDR','Rp'],['Philippine Peso','PHP','₱'],['Vietnamese Dong','VND','₫'],
  ['Kenyan Shilling','KES','KSh'],['Nigerian Naira','NGN','₦'],['Egyptian Pound','EGP','£'],
  ['Argentine Peso','ARS','$'],['Chilean Peso','CLP','$'],['Colombian Peso','COP','$'],
];

const CACHE_MINS = 60;
let allRates    = {};
let baseCurr    = 'GBP';
let lastFetched = null;

// World converter state
let wcFromCode   = 'GBP';
let wcFromName   = 'British Pound';
let wcFromSymbol = '£';
let wcToCode     = null;
let wcToName     = null;
let wcToSymbol   = null;

// ── Helpers ───────────────────────────────────────────────
function formatAmount(amount, symbol) {
  if (isNaN(amount) || !isFinite(amount) || amount === 0) return `${symbol}0.00`;
  const num = Math.abs(amount) >= 1000
    ? amount.toLocaleString('en-GB', { minimumFractionDigits:2, maximumFractionDigits:2 })
    : amount.toFixed(2);
  return `${symbol}${num}`;
}

function getSymbol(code) {
  const o = OFFICE_CURRENCIES.find(c => c.code === code);
  if (o) return o.symbol;
  const w = WORLD_CURRENCIES.find(c => c[1] === code);
  return w?.[2] || '';
}

function convertAmount(amount, fromCode, toCode) {
  if (fromCode === toCode)   return amount;
  if (fromCode === baseCurr) return amount * (allRates[toCode]   || 0);
  if (toCode   === baseCurr) return amount / (allRates[fromCode] || 1);
  return (amount / (allRates[fromCode] || 1)) * (allRates[toCode] || 0);
}

function searchCurrencies(q) {
  if (!q || q.length < 1) return [];
  const lq = q.toLowerCase();
  return WORLD_CURRENCIES.filter(([name, code]) =>
    name.toLowerCase().includes(lq) || code.toLowerCase().includes(lq)
  ).slice(0, 8);
}

// ── Fetch ─────────────────────────────────────────────────
async function fetchRates(base) {
  const res  = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
  if (!res.ok) throw new Error('Fetch failed');
  return (await res.json()).rates;
}

async function loadRates(forceRefresh = false) {
  showLoading();
  try {
    const stored = await chrome.storage.local.get({ ratesCache:null, ratesCacheTime:0, ratesBase:'GBP' });
    if (!forceRefresh && stored.ratesCache && stored.ratesBase === baseCurr) {
      const age = (Date.now() - stored.ratesCacheTime) / 60000;
      if (age < CACHE_MINS) {
        allRates = stored.ratesCache; lastFetched = new Date(stored.ratesCacheTime);
        render(); return;
      }
    }
    allRates = await fetchRates(baseCurr); lastFetched = new Date();
    await chrome.storage.local.set({ ratesCache:allRates, ratesCacheTime:Date.now(), ratesBase:baseCurr });
    render();
  } catch(e) { showError(); }
}

// ── Render ────────────────────────────────────────────────
function render() {
  document.getElementById('loading').style.display      = 'none';
  document.getElementById('error-state').style.display  = 'none';
  document.getElementById('main-content').style.display = 'block';
  renderBasePicker();
  renderTiles();
  updateWorldResult();
  renderUpdateNote();
}

function renderBasePicker() {
  const picker = document.getElementById('base-picker');
  picker.innerHTML = OFFICE_CURRENCIES.map(c =>
    `<button class="base-btn${c.code === baseCurr ? ' active' : ''}" data-code="${c.code}">${c.flag} ${c.code}</button>`
  ).join('');
  picker.querySelectorAll('.base-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      baseCurr = btn.dataset.code;
      await loadRates(true);
    });
  });
  document.getElementById('rates-label').textContent = `Office rates (base: ${baseCurr})`;
}

function renderTiles() {
  const tileAmount = parseFloat(document.getElementById('tile-amount').value) || 1;
  document.getElementById('tiles').innerHTML = OFFICE_CURRENCIES.map(c => {
    const isBase = c.code === baseCurr;
    const converted = isBase ? tileAmount : convertAmount(tileAmount, baseCurr, c.code);
    const cls = ['tile', isBase ? 'base-tile' : '', c.fullWidth ? 'full' : ''].filter(Boolean).join(' ');
    const badge = isBase
      ? `<span class="tile-badge">Base</span>`
      : `<span class="tile-rate-lbl">= </span>`;
    return `<div class="${cls}" data-code="${c.code}">
      <div class="tile-top"><div class="tile-flag">${c.flag}</div>${badge}</div>
      <div class="tile-currency">${c.code}</div>
      <div class="tile-name">${c.name}</div>
      <div class="tile-amount">${formatAmount(converted, c.symbol)}</div>
      <div class="tile-sub">${c.office}</div>
    </div>`;
  }).join('');

  // Click tile to set as base
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', async () => {
      const code = tile.dataset.code;
      if (code === baseCurr) return;
      baseCurr = code;
      await loadRates(true);
    });
  });
}

// ── World converter ───────────────────────────────────────
function updateWorldResult() {
  const amount    = parseFloat(document.getElementById('wc-amount').value) || 0;
  const resultsEl = document.getElementById('wc-results');

  if (!wcToCode) {
    resultsEl.innerHTML = '<div style="font-size:11px;color:var(--text3);padding:4px 0;">Search a currency above to convert.</div>';
    return;
  }

  const converted = convertAmount(amount, wcFromCode, wcToCode);
  const rate1     = convertAmount(1, wcFromCode, wcToCode);
  const rateBack  = convertAmount(1, wcToCode, wcFromCode);

  resultsEl.innerHTML = `
    <div class="conv-result-row" style="font-size:15px;padding:6px 0;">
      <span style="color:var(--text2);">${formatAmount(amount, wcFromSymbol)}</span>
      <span style="font-size:18px;font-weight:700;">${formatAmount(converted, wcToSymbol)}</span>
    </div>
    <div style="font-size:10px;color:var(--text3);padding-top:6px;border-top:1px solid var(--border);margin-top:4px;">
      1 ${wcFromCode} = ${formatAmount(rate1, wcToSymbol)} &nbsp;·&nbsp; 1 ${wcToCode} = ${formatAmount(rateBack, wcFromSymbol)}
    </div>`;
}

function setupSearchDropdown(inputEl, dropdownEl, onSelect) {
  inputEl.addEventListener('input', () => {
    const results = searchCurrencies(inputEl.value);
    if (!results.length) { dropdownEl.classList.remove('open'); return; }
    dropdownEl.innerHTML = results.map(([name, code, symbol]) =>
      `<div class="search-option" data-code="${code}" data-name="${name}" data-symbol="${symbol}">
        <div class="search-option-name">${name}</div>
        <div class="search-option-code">${code}</div>
      </div>`
    ).join('');
    dropdownEl.classList.add('open');
    dropdownEl.querySelectorAll('.search-option').forEach(opt => {
      opt.addEventListener('click', () => {
        onSelect(opt.dataset.code, opt.dataset.name, opt.dataset.symbol);
        dropdownEl.classList.remove('open');
      });
    });
  });
  document.addEventListener('click', e => {
    if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) dropdownEl.classList.remove('open');
  });
}

function initWorldConverter() {
  const wcFromInput = document.getElementById('wc-from-input');
  const wcFromDrop  = document.getElementById('wc-from-dropdown');
  const wcToInput   = document.getElementById('wc-to-input');
  const wcToDrop    = document.getElementById('wc-to-dropdown');
  const wcAmountEl  = document.getElementById('wc-amount');
  const btnSwap     = document.getElementById('btn-swap');

  const baseC = OFFICE_CURRENCIES.find(c => c.code === baseCurr);
  wcFromInput.value = `${baseC.name} (${baseC.code})`;
  wcFromCode = baseCurr; wcFromName = baseC.name; wcFromSymbol = baseC.symbol;

  setupSearchDropdown(wcFromInput, wcFromDrop, (code, name, symbol) => {
    wcFromCode = code; wcFromName = name; wcFromSymbol = symbol;
    wcFromInput.value = `${name} (${code})`;
    updateWorldResult();
  });

  setupSearchDropdown(wcToInput, wcToDrop, (code, name, symbol) => {
    wcToCode = code; wcToName = name; wcToSymbol = symbol;
    wcToInput.value = `${name} (${code})`;
    updateWorldResult();
  });

  btnSwap.addEventListener('click', () => {
    if (!wcToCode) return;
    [wcFromCode, wcToCode]     = [wcToCode, wcFromCode];
    [wcFromName, wcToName]     = [wcToName, wcFromName];
    [wcFromSymbol, wcToSymbol] = [wcToSymbol, wcFromSymbol];
    wcFromInput.value = `${wcFromName} (${wcFromCode})`;
    wcToInput.value   = `${wcToName} (${wcToCode})`;
    updateWorldResult();
  });

  wcAmountEl.addEventListener('input', updateWorldResult);

  // Tile amount input
  document.getElementById('tile-amount').addEventListener('input', renderTiles);
}

// ── States ────────────────────────────────────────────────
function showLoading() {
  document.getElementById('loading').style.display      = 'block';
  document.getElementById('error-state').style.display  = 'none';
  document.getElementById('main-content').style.display = 'none';
}

function showError() {
  document.getElementById('loading').style.display      = 'none';
  document.getElementById('error-state').style.display  = 'block';
  document.getElementById('main-content').style.display = 'none';
}

function renderUpdateNote() {
  if (!lastFetched) return;
  const mins  = Math.round((Date.now() - lastFetched.getTime()) / 60000);
  const label = mins < 1 ? 'just now' : mins === 1 ? '1 min ago' : `${mins} mins ago`;
  document.getElementById('update-note').textContent = `Rates via European Central Bank · ${label}`;
}

// ── Init ──────────────────────────────────────────────────
document.getElementById('btn-refresh').addEventListener('click', () => loadRates(true));
document.getElementById('btn-retry').addEventListener('click',   () => loadRates(true));

(async () => {
  const stored = await chrome.storage.local.get({ ratesBase:'GBP' });
  baseCurr = stored.ratesBase;
  initWorldConverter();
  await loadRates();
})();
