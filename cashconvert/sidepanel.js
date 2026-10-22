// CashConvert side panel

const OFFICES = [
  { code: 'GBP', place: 'UK' },
  { code: 'EUR', place: 'Europe' },
  { code: 'USD', place: 'United States' },
  { code: 'BRL', place: 'Brazil' },
  { code: 'CNY', place: 'China' }
];
const ENDPOINTS = ['https://api.frankfurter.dev/v1', 'https://api.frankfurter.app'];
const CACHE_MINUTES = 60;

const $ = (id) => document.getElementById(id);
let rates = null;          // { EUR: 1, GBP: 0.8, ... } (EUR based)
let names = {};            // { GBP: 'British Pound', ... }
let base = 'GBP';
let found = null;          // { text, amount, currency }
let fromCur = 'JPY', toCur = 'GBP';

// ---------- helpers ----------
function fmt(value, cur) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(value);
  } catch { return value.toFixed(2) + ' ' + cur; }
}
function convert(amount, from, to) {
  if (!rates || !(from in rates) || !(to in rates)) return null;
  return amount / rates[from] * rates[to];
}
function readAmount() {
  const v = parseFloat(String($('amount').value).replace(/,/g, ''));
  return isFinite(v) ? v : 0;
}
function timeText(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

async function fetchJson(path) {
  let lastErr;
  for (const root of ENDPOINTS) {
    try {
      const res = await fetch(root + path);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

// ---------- rates ----------
async function loadRates(force) {
  const store = await chrome.storage.local.get(['ratesCache', 'namesCache']);
  const cache = store.ratesCache;
  if (store.namesCache) names = store.namesCache;
  const fresh = cache && (Date.now() - cache.fetchedAt) < CACHE_MINUTES * 60000;

  if (cache) { rates = cache.rates; renderAll(); }
  if (fresh && !force) { setStatus('ok', cache.fetchedAt); return; }

  setStatus('loading');
  $('refresh').classList.add('spin');
  try {
    const data = await fetchJson('/latest?base=EUR');
    rates = Object.assign({ EUR: 1 }, data.rates);
    const fetchedAt = Date.now();
    await chrome.storage.local.set({ ratesCache: { rates, fetchedAt, date: data.date } });
    if (!store.namesCache) {
      try { names = await fetchJson('/currencies'); await chrome.storage.local.set({ namesCache: names }); } catch {}
    }
    setStatus('ok', fetchedAt);
    renderAll();
  } catch {
    setStatus('offline', cache ? cache.fetchedAt : null);
  } finally {
    $('refresh').classList.remove('spin');
  }
}

function setStatus(state, ts) {
  const s = $('status');
  s.classList.toggle('offline', state === 'offline');
  $('pennyStatus').hidden = state === 'ok';
  if (state === 'loading') {
    setPenny($('pennyStatus'), 'thinking');
    $('updated').textContent = 'Fetching today’s rates…';
  } else if (state === 'offline') {
    setPenny($('pennyStatus'), 'oops');
    $('updated').textContent = ts ? 'Can’t reach the rates. Using saved rates from ' + timeText(ts) + '.'
      : 'Can’t reach the rates. Check your connection and tap refresh.';
  } else {
    $('updated').textContent = 'Updated ' + timeText(ts) + ', ECB rates via Frankfurter';
  }
}

// ---------- rendering ----------
function codes() {
  return rates ? Object.keys(rates).sort() : OFFICES.map(o => o.code);
}
function fillSelect(sel, value) {
  const current = value || sel.value;
  sel.replaceChildren();
  for (const c of codes()) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    if (names[c]) opt.title = names[c];
    sel.appendChild(opt);
  }
  if (current) sel.value = current;
}

function renderTiles() {
  const amount = readAmount();
  const wrap = $('tiles');
  wrap.replaceChildren();
  for (const o of OFFICES) {
    const btn = document.createElement('button');
    btn.className = 'tile' + (o.code === base ? ' is-base' : '');
    const val = o.code === base ? amount : convert(amount, base, o.code);
    btn.innerHTML = '<span class="code"></span><span class="value"></span><span class="place"></span>';
    btn.querySelector('.code').textContent = o.code === base ? 'Base: ' + o.code : o.code;
    btn.querySelector('.value').textContent = val === null ? '…' : fmt(val, o.code);
    btn.querySelector('.place').textContent = o.place;
    if (o.code === base) btn.setAttribute('aria-current', 'true');
    else btn.addEventListener('click', () => setBase(o.code));
    wrap.appendChild(btn);
  }
  const tip = document.createElement('div');
  tip.className = 'tile tip';
  tip.textContent = 'Tip: highlight a price on any page, then right-click it';
  wrap.appendChild(tip);
}

function renderWorld() {
  const from = $('from').value, to = $('to').value;
  const amount = readAmount();
  const v = convert(amount, from, to);
  $('worldResult').textContent = v === null ? 'Waiting for rates…' : fmt(amount, from) + ' = ' + fmt(v, to);
}

function renderFound() {
  if (!found) { $('found').hidden = true; return; }
  $('found').hidden = false;
  $('foundText').textContent = found.text;
  const known = rates && found.currency && found.currency in rates;
  $('foundPick').hidden = known;
  if (!known) {
    fillSelect($('foundCur'), found.currency && rates && found.currency in rates ? found.currency : 'USD');
    found.currency = $('foundCur').value;
  }
  const v = convert(found.amount, found.currency, base);
  $('foundLabel').textContent = 'In ' + base;
  $('foundValue').textContent = v === null ? '…' : fmt(v, base);
  setPenny($('pennyFound'), 'cheer');

  const list = $('foundOthers');
  list.replaceChildren();
  for (const o of OFFICES) {
    if (o.code === base || o.code === found.currency) continue;
    const val = convert(found.amount, found.currency, o.code);
    const li = document.createElement('li');
    li.innerHTML = '<span class="code"></span><span class="val"></span>';
    li.querySelector('.code').textContent = o.code;
    li.querySelector('.val').textContent = val === null ? '…' : fmt(val, o.code);
    list.appendChild(li);
  }
}

function renderAll() {
  fillSelect($('base'), base);
  fillSelect($('from'), fromCur);
  fillSelect($('to'), toCur);
  renderTiles();
  renderWorld();
  renderFound();
}

// ---------- actions ----------
async function setBase(code) {
  base = code;
  $('base').value = code;
  await chrome.storage.local.set({ base: code });
  renderTiles(); renderFound();
}

async function handlePending(pending) {
  if (!pending || !pending.text) return;
  const parsed = parsePrice(pending.text, rates ? Object.keys(rates) : null);
  if (!parsed) {
    found = null;
    $('found').hidden = true;
    $('greeting').textContent = 'Hmm, I couldn’t spot a price in “' + pending.text.slice(0, 40) + '”. Try highlighting just the price.';
    setPenny($('pennyHead'), 'oops');
    setTimeout(() => { setPenny($('pennyHead'), 'happy'); $('greeting').textContent = 'Hi, I’m Penny! What shall we convert?'; }, 6000);
    return;
  }
  found = { text: pending.text, amount: parsed.amount, currency: parsed.currency };
  $('copyLabel').textContent = 'Copy';
  renderFound();
  $('found').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- events ----------
$('amount').addEventListener('input', () => { renderTiles(); renderWorld(); });
$('base').addEventListener('change', (e) => setBase(e.target.value));
$('from').addEventListener('change', async (e) => { fromCur = e.target.value; await chrome.storage.local.set({ from: e.target.value }); renderWorld(); });
$('to').addEventListener('change', async (e) => { toCur = e.target.value; await chrome.storage.local.set({ to: e.target.value }); renderWorld(); });
$('swap').addEventListener('click', async () => {
  [fromCur, toCur] = [toCur, fromCur];
  $('from').value = fromCur;
  $('to').value = toCur;
  await chrome.storage.local.set({ from: fromCur, to: toCur });
  renderWorld();
});
$('refresh').addEventListener('click', () => loadRates(true));
$('foundCur').addEventListener('change', (e) => { if (found) { found.currency = e.target.value; renderFound(); } });
$('clearFound').addEventListener('click', async () => {
  found = null; renderFound();
  await chrome.storage.session.remove('pending');
});
$('copyBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('foundValue').textContent);
    $('copyLabel').textContent = 'Copied';
  } catch { $('copyLabel').textContent = 'Copy failed'; }
  setTimeout(() => { $('copyLabel').textContent = 'Copy'; }, 2000);
});

chrome.storage.session.onChanged.addListener((changes) => {
  if (changes.pending && changes.pending.newValue) handlePending(changes.pending.newValue);
});

// ---------- start ----------
(async function init() {
  setPenny($('pennyHead'), 'happy');
  const saved = await chrome.storage.local.get(['base', 'from', 'to']);
  base = saved.base || 'GBP';
  fromCur = saved.from || 'JPY';
  toCur = saved.to || 'GBP';
  renderAll();
  await loadRates(false);
  const { pending } = await chrome.storage.session.get('pending');
  if (pending && Date.now() - pending.at < 5 * 60000) handlePending(pending);
})();
