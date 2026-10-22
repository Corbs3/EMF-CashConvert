// Penny the coin: one SVG per mood (static strings, no user content)
const PENNY_BODY = '<circle cx="60" cy="64" r="46" fill="#F4C542" stroke="#C98A10" stroke-width="5"/>' +
  '<circle cx="60" cy="64" r="37" fill="none" stroke="#E0A92A" stroke-width="3"/>';
const CHEEKS = '<circle cx="38" cy="72" r="5.5" fill="#F08A6B" opacity="0.6"/><circle cx="82" cy="72" r="5.5" fill="#F08A6B" opacity="0.6"/>';
const ARM = (d) => '<path d="' + d + '" stroke="#1B3A2D" stroke-width="6" fill="none" stroke-linecap="round"/>';

const PENNY = {
  happy: ARM('M18 64 Q6 52 12 38') + ARM('M102 64 Q116 50 108 34') + PENNY_BODY +
    '<path d="M32 44 Q38 30 52 26" stroke="#FFF3C4" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="47" cy="58" rx="4.5" ry="6.5" fill="#1B3A2D"/><ellipse cx="73" cy="58" rx="4.5" ry="6.5" fill="#1B3A2D"/>' +
    CHEEKS + '<path d="M48 74 Q60 86 72 74" stroke="#1B3A2D" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
  cheer: ARM('M18 60 Q4 44 14 26') + ARM('M102 60 Q116 44 106 26') + PENNY_BODY +
    '<path d="M40 58 Q47 50 54 58" stroke="#1B3A2D" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<path d="M66 58 Q73 50 80 58" stroke="#1B3A2D" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    CHEEKS + '<path d="M46 72 Q60 92 74 72 Z" fill="#1B3A2D"/>',
  thinking: ARM('M18 70 Q10 82 22 90') + ARM('M102 70 Q96 86 76 88') + PENNY_BODY +
    '<circle cx="50" cy="52" r="5" fill="#1B3A2D"/><circle cx="76" cy="52" r="5" fill="#1B3A2D"/>' +
    '<path d="M52 78 L70 76" stroke="#1B3A2D" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
    '<circle cx="98" cy="18" r="5" fill="#2D6A4F"/><circle cx="110" cy="8" r="3.5" fill="#2D6A4F"/>',
  oops: ARM('M18 64 Q8 70 14 82') + ARM('M102 64 Q112 70 106 82') + PENNY_BODY +
    '<path d="M40 50 L52 54" stroke="#1B3A2D" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M80 50 L68 54" stroke="#1B3A2D" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="48" cy="62" r="4.5" fill="#1B3A2D"/><circle cx="72" cy="62" r="4.5" fill="#1B3A2D"/>' +
    '<path d="M50 82 Q60 74 70 82" stroke="#1B3A2D" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
    '<path d="M88 40 Q92 48 88 52 Q84 48 88 40 Z" fill="#7BB8E0"/>'
};
const PENNY_LABEL = { happy: 'Penny the coin, waving', cheer: 'Penny the coin, cheering',
  thinking: 'Penny the coin, thinking', oops: 'Penny the coin, looking worried' };

function setPenny(el, mood) {
  if (!el) return;
  el.innerHTML = '<svg viewBox="0 0 120 120" width="100%" height="100%" role="img" aria-label="' +
    PENNY_LABEL[mood] + '">' + PENNY[mood] + '</svg>';
}
