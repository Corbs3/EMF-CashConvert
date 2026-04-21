const CURRENCIES = [
  { code:'GBP', flag:'🇬🇧', name:'British Pound',  symbol:'£',  office:'United Kingdom' },
  { code:'EUR', flag:'🇪🇺', name:'Euro',            symbol:'€',  office:'Brussels'       },
  { code:'BRL', flag:'🇧🇷', name:'Brazilian Real',  symbol:'R$', office:'Brazil'         },
  { code:'CNY', flag:'🇨🇳', name:'Chinese Yuan',    symbol:'¥',  office:'Beijing'        },
  { code:'USD', flag:'🇺🇸', name:'US Dollar',       symbol:'$',  office:'New York', fullWidth:true },
];

const CACHE_MINS = 60;
let rates    = {};
let baseCurr = 'GBP';
let lastFetched = null;

// ── Format ────────────────────────────────────────────────
function formatAmount(amount, code) {
  const c = CURRENCIES.find(x => x.code === code);
  const sym = c?.symbol || '';
  const num = amount >= 1000
    ? amount.toLocaleString('en-GB', { minimumFractionDigits:2, maximumFractionDigits:2 })
    : amount.toFixed(2);
  return `${sym}${num}`;
}

// ── Fetch rates ───────────────────────────────────────────
async function fetchRates(base) {
  const others = CURRENCIES.filter(c => c.code !== base).map(c => c.code).join(',');
  const res    = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${others}`);
  if (!res.ok) throw new Error('Fetch failed');
  const data   = await res.json();
  return data.rates;
}

async function loadRates(forceRefresh = false) {
  showLoading();

  try {
    const stored = await chrome.storage.local.get({ ratesCache: null, ratesCacheTime: 0, ratesBase: 'GBP' });

    // Use cache if fresh and base matches
    if (!forceRefresh && stored.ratesCache && stored.ratesBase === baseCurr) {
      const age = (Date.now() - stored.ratesCacheTime) / 60000;
      if (age < CACHE_MINS) {
        rates       = stored.ratesCache;
        lastFetched = new Date(stored.ratesCacheTime);
        render();
        return;
      }
    }

    rates = await fetchRates(baseCurr);
    lastFetched = new Date();
    await chrome.storage.local.set({ ratesCache: rates, ratesCacheTime: Date.now(), ratesBase: baseCurr });
    render();
  } catch (e) {
    showError();
  }
}

// ── Render ────────────────────────────────────────────────
function render() {
  document.getElementById('loading').classList.remove('visible');
  document.getElementById('error').classList.remove('visible');
  document.getElementById('main-content').style.display = 'block';

  renderBasePicker();
  renderTiles();
  renderConverter();
  renderUpdateNote();
}

function renderBasePicker() {
  const picker = document.getElementById('base-picker');
  picker.innerHTML = CURRENCIES.map(c =>
    `<button class="base-btn${c.code === baseCurr ? ' active' : ''}" data-code="${c.code}">${c.flag} ${c.code}</button>`
  ).join('');
  picker.querySelectorAll('.base-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      baseCurr = btn.dataset.code;
      await chrome.storage.local.set({ ratesBase: baseCurr });
      await loadRates(true);
    });
  });
  document.getElementById('rates-label').textContent = `Rates (base: ${baseCurr})`;
}

function renderTiles() {
  const tilesEl = document.getElementById('tiles');
  tilesEl.innerHTML = CURRENCIES.map(c => {
    const isBase  = c.code === baseCurr;
    const rate    = isBase ? 1 : (rates[c.code] || 0);
    const cls     = ['tile', isBase ? 'base-tile' : '', c.fullWidth ? 'full' : ''].filter(Boolean).join(' ');
    const badge   = isBase
      ? `<span class="tile-badge">Base</span>`
      : `<span class="tile-rate-lbl">1 ${baseCurr} =</span>`;

    return `<div class="${cls}">
      <div class="tile-top">
        <div class="tile-flag">${c.flag}</div>
        ${badge}
      </div>
      <div class="tile-currency">${c.code}</div>
      <div class="tile-name">${c.name}</div>
      <div class="tile-amount">${isBase ? formatAmount(1, c.code) : formatAmount(rate, c.code)}</div>
      <div class="tile-sub">${c.office}</div>
    </div>`;
  }).join('');
}

function renderConverter() {
  const fromEl    = document.getElementById('conv-from');
  const amountEl  = document.getElementById('conv-amount');
  const resultsEl = document.getElementById('conv-results');

  fromEl.innerHTML = CURRENCIES.map(c =>
    `<option value="${c.code}" ${c.code === baseCurr ? 'selected' : ''}>${c.flag} ${c.code} — ${c.name}</option>`
  ).join('');

  function update() {
    const amount   = parseFloat(amountEl.value) || 0;
    const fromCode = fromEl.value;

    resultsEl.innerHTML = CURRENCIES.filter(c => c.code !== fromCode).map(c => {
      let converted;
      if (fromCode === baseCurr) {
        converted = amount * (rates[c.code] || 0);
      } else if (c.code === baseCurr) {
        converted = amount / (rates[fromCode] || 1);
      } else {
        // Cross rate via base
        const toBase   = amount / (rates[fromCode] || 1);
        converted = toBase * (rates[c.code] || 0);
      }
      return `<div class="conv-result-row">
        <span class="conv-result-label">${c.flag} ${c.code}</span>
        <span class="conv-result-amount">${formatAmount(converted, c.code)}</span>
      </div>`;
    }).join('');
  }

  fromEl.addEventListener('change', update);
  amountEl.addEventListener('input', update);
  update();
}

function renderUpdateNote() {
  if (!lastFetched) return;
  const mins = Math.round((Date.now() - lastFetched.getTime()) / 60000);
  const label = mins < 1 ? 'just now' : mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
  document.getElementById('update-note').textContent = `Rates via European Central Bank · updated ${label}`;
}

// ── States ────────────────────────────────────────────────
function showLoading() {
  document.getElementById('loading').classList.add('visible');
  document.getElementById('error').classList.remove('visible');
  document.getElementById('main-content').style.display = 'none';
}

function showError() {
  document.getElementById('loading').classList.remove('visible');
  document.getElementById('error').classList.add('visible');
  document.getElementById('main-content').style.display = 'none';
}

// ── Events ────────────────────────────────────────────────
document.getElementById('btn-refresh').addEventListener('click', () => loadRates(true));
document.getElementById('btn-retry').addEventListener('click', () => loadRates(true));

// ── Init ──────────────────────────────────────────────────
(async () => {
  const stored = await chrome.storage.local.get({ ratesBase: 'GBP' });
  baseCurr = stored.ratesBase;
  await loadRates();
})();
