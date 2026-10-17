export { modelLabel } from '../../main/models.js';

// A stable hue per advisor, derived from its folder name, so a voice keeps its
// color across sessions without anyone having to choose one.
export function hueFor(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

export function initials(name) {
  const words = name.replace(/^the\s+/i, '').split(/\s+/).filter(Boolean);
  return (words[0]?.[0] || '?').toUpperCase() + (words[1]?.[0] || '').toUpperCase();
}

// Dollars, with enough precision that a fraction-of-a-cent reply doesn't read as $0.00.
export const money = (n) => (n == null ? '' : `$${n.toFixed(n < 0.01 ? 4 : n < 1 ? 3 : 2)}`);

export const portraitUrl = (rel) => `vault://${rel.split('/').map(encodeURIComponent).join('/')}`;
