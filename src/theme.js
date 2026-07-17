import { useColorScheme, Platform } from "react-native";
import { useProfile } from "./lib/profile";
import { hexToHsl, hslToHex, hslToRgba } from "./lib/color";

const neutralLight = {
  bg: "#f6f5f2",
  cardBg: "#ffffff",
  text: "#2a2a28",
  textDim: "#6b6a66",
  border: "#e4e1da",
  danger: "#c0392b",
  scheme: "light",
};

const neutralDark = {
  bg: "#1c1b19",
  cardBg: "#262521",
  text: "#f1efe9",
  textDim: "#a8a59d",
  border: "#38362f",
  danger: "#e0392b",
  scheme: "dark",
};

// Every preset is just a base color — accent/hover/soft/ring for both light
// and dark mode are all derived from it (see buildPresetAccentColors below),
// so adding a new option here is a one-line change.
export const ACCENT_PRESETS = [
  { key: "maroon", label: "Maroon", base: "#7c2140" },
  { key: "indigo", label: "Indigo", base: "#273f86" },
  { key: "forest", label: "Forest", base: "#276847" },
  { key: "plum", label: "Plum", base: "#6e388a" },
  { key: "amber", label: "Amber", base: "#a05d22" },
  { key: "teal", label: "Teal", base: "#20686f" },
];

const DEFAULT_ACCENT_KEY = "maroon";

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// Fixed saturation/lightness targets per role, tuned to reproduce the
// original hand-picked maroon theme almost exactly when fed #7c2140. Presets
// only supply a hue+saturation — their own lightness is ignored on purpose,
// since every preset was authored as a light-mode-ish swatch and this is
// what maps it to a readable color in both modes.
function buildPresetAccentColors(baseHex, scheme) {
  const { h, s } = hexToHsl(baseHex);
  if (scheme === "dark") {
    return {
      accent: hslToHex(h, s, 66),
      accentHover: hslToHex(h, s, 73),
      accentSoft: hslToHex(h, s * 0.47, 18),
      accentRing: hslToRgba(h, s, 66, 0.22),
    };
  }
  return {
    accent: hslToHex(h, s, 31),
    accentHover: hslToHex(h, s, 24),
    accentSoft: hslToHex(h, s * 0.8, 91),
    accentRing: hslToRgba(h, s, 31, 0.16),
  };
}

// Custom (color-wheel-picked) colors, unlike presets, need their lightness to
// actually matter — that's the whole point of the lightness slider. Each
// scheme gets a wide-but-bounded window so the slider stays responsive across
// most of its range while never landing on an illegibly pale/dark accent.
function buildCustomAccentColors(baseHex, scheme) {
  const { h, s, l } = hexToHsl(baseHex);
  if (scheme === "dark") {
    const accentL = clamp(l, 50, 85);
    const hoverL = clamp(accentL + 8, 50, 92);
    return {
      accent: hslToHex(h, s, accentL),
      accentHover: hslToHex(h, s, hoverL),
      accentSoft: hslToHex(h, s * 0.47, 18),
      accentRing: hslToRgba(h, s, accentL, 0.22),
    };
  }
  const accentL = clamp(l, 15, 50);
  const hoverL = clamp(accentL - 8, 8, 50);
  return {
    accent: hslToHex(h, s, accentL),
    accentHover: hslToHex(h, s, hoverL),
    accentSoft: hslToHex(h, s * 0.8, 91),
    accentRing: hslToRgba(h, s, accentL, 0.16),
  };
}

export function resolveAccentBase(accent) {
  const preset = ACCENT_PRESETS.find((p) => p.key === accent);
  if (preset) return preset.base;
  if (/^#?[0-9a-fA-F]{6}$/.test(accent || "")) return accent.startsWith("#") ? accent : `#${accent}`;
  return ACCENT_PRESETS.find((p) => p.key === DEFAULT_ACCENT_KEY).base;
}

export function isCustomAccent(accent) {
  return !ACCENT_PRESETS.some((p) => p.key === accent);
}

export const radius = 10;

export function useTheme() {
  const systemScheme = useColorScheme();
  // useProfile() returns null when rendered outside a ProfileProvider (e.g. the
  // login screen, before a user is signed in) — system scheme + default accent
  // win there.
  const profileCtx = useProfile();
  const themePreference = profileCtx?.profile?.theme || "system";
  const accent = profileCtx?.profile?.accent || DEFAULT_ACCENT_KEY;

  const scheme = themePreference === "system" ? systemScheme : themePreference;
  const neutral = scheme === "dark" ? neutralDark : neutralLight;
  const resolvedScheme = scheme === "dark" ? "dark" : "light";
  const accentColors = isCustomAccent(accent)
    ? buildCustomAccentColors(resolveAccentBase(accent), resolvedScheme)
    : buildPresetAccentColors(resolveAccentBase(accent), resolvedScheme);

  return { ...neutral, ...accentColors };
}

// Cross-platform shadow helper: real box-shadow on web, elevation/shadow* elsewhere.
export function shadow(colors, size = "sm") {
  const opacityBySize = { sm: 0.08, md: 0.12, lg: 0.18 };
  const radiusBySize = { sm: 3, md: 10, lg: 22 };
  const elevationBySize = { sm: 1, md: 4, lg: 10 };

  if (Platform.OS === "web") {
    const alpha = opacityBySize[size];
    return {
      boxShadow: `0 ${radiusBySize[size] / 2}px ${radiusBySize[size]}px rgba(20,18,14,${alpha})`,
    };
  }
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: elevationBySize[size] / 2 },
    shadowOpacity: opacityBySize[size],
    shadowRadius: radiusBySize[size],
    elevation: elevationBySize[size],
  };
}
