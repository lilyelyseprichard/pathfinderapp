// Small HSL <-> hex/rgba helpers used to derive a full accent palette (accent,
// hover, soft, ring — for both light and dark mode) from a single base color,
// and to drive the custom color wheel.

export function hexToRgb(hex) {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function toHexByte(n) {
  return Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
}

export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

export function hslToRgba(h, s, l, alpha) {
  const { r, g, b } = hslToRgb(h, s, l);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isValidHex(hex) {
  return /^#?[0-9a-fA-F]{6}$/.test(hex);
}

export function normalizeHex(hex) {
  const clean = hex.replace("#", "");
  return `#${clean.toLowerCase()}`;
}
