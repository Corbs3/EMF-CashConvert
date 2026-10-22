// Penny's price parser: turns "€1.234,50" or "US$ 99" into { amount, currency }

const SYMBOLS = [
  ['R$', 'BRL'], ['US$', 'USD'], ['A$', 'AUD'], ['AU$', 'AUD'], ['C$', 'CAD'], ['CA$', 'CAD'],
  ['NZ$', 'NZD'], ['HK$', 'HKD'], ['S$', 'SGD'], ['CN¥', 'CNY'], ['RMB', 'CNY'], ['元', 'CNY'],
  ['€', 'EUR'], ['£', 'GBP'], ['$', 'USD'], ['¥', 'CNY'], ['₹', 'INR'], ['₩', 'KRW'],
  ['₺', 'TRY'], ['₪', 'ILS'], ['₱', 'PHP'], ['฿', 'THB'], ['zł', 'PLN'], ['Kč', 'CZK'],
  ['Ft', 'HUF'], ['kr', 'SEK'], ['CHF', 'CHF']
];

const WORDS = { euro: 'EUR', euros: 'EUR', pound: 'GBP', pounds: 'GBP', dollar: 'USD', dollars: 'USD',
  real: 'BRL', reais: 'BRL', yuan: 'CNY', renminbi: 'CNY', yen: 'JPY' };

function detectCurrency(text, known) {
  const upper = text.toUpperCase();
  const code = upper.match(/\b([A-Z]{3})\b/g);
  if (code) {
    const hit = code.find(c => !known || known.includes(c));
    if (hit) return hit;
  }
  for (const [sym, cur] of SYMBOLS) {
    if (text.includes(sym)) return cur;
  }
  const word = text.toLowerCase().match(/[a-z]+/g) || [];
  for (const w of word) if (WORDS[w]) return WORDS[w];
  return null;
}

function parseNumber(raw, currency) {
  let s = raw.replace(/[\s\u00a0\u202f']/g, '');
  const m = s.match(/\d[\d.,]*/);
  if (!m) return null;
  s = m[0].replace(/[.,]$/, '');
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot > -1 && lastComma > -1) {
    const dec = lastDot > lastComma ? '.' : ',';
    const thou = dec === '.' ? ',' : '.';
    s = s.split(thou).join('').replace(dec, '.');
  } else if (lastComma > -1) {
    const parts = s.split(',');
    const tail = parts[parts.length - 1];
    s = (parts.length === 2 && tail.length !== 3) ? parts.join('.') : parts.join('');
  } else if (lastDot > -1) {
    const parts = s.split('.');
    const tail = parts[parts.length - 1];
    const commaDecimalCur = ['EUR', 'BRL'].includes(currency);
    if (parts.length > 2 || (tail.length === 3 && commaDecimalCur)) s = parts.join('');
  }
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function parsePrice(text, known) {
  if (!text) return null;
  const currency = detectCurrency(text, known);
  const amount = parseNumber(text, currency);
  if (amount === null) return null;
  return { amount, currency };
}

if (typeof module !== 'undefined') module.exports = { parsePrice };
