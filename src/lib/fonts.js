// Generic CSS font-family keywords rather than bundled font files — no
// expo-font loading/asset config needed, and react-native-web passes them
// straight through as valid CSS values (this app's actual deployment
// target). Native falls back to each platform's default mapping for the
// same generic keywords, which is a reasonable approximation there too.
export const FONTS = [
  { key: "system", label: "Default", family: undefined },
  { key: "serif", label: "Serif", family: "serif" },
  { key: "sans", label: "Sans-serif", family: "sans-serif" },
  { key: "mono", label: "Monospace", family: "monospace" },
];

export function fontFamilyFor(key) {
  return FONTS.find((f) => f.key === key)?.family;
}
