import { useColorScheme, Platform } from "react-native";
import { useProfile } from "./lib/profile";

const light = {
  bg: "#f6f5f2",
  cardBg: "#ffffff",
  text: "#2a2a28",
  textDim: "#6b6a66",
  accent: "#7c2140",
  accentHover: "#641933",
  accentSoft: "#f3dde5",
  accentRing: "rgba(124, 33, 64, 0.16)",
  border: "#e4e1da",
  danger: "#c0392b",
  scheme: "light",
};

const dark = {
  bg: "#1c1b19",
  cardBg: "#262521",
  text: "#f1efe9",
  textDim: "#a8a59d",
  accent: "#d9789a",
  accentHover: "#e393ae",
  accentSoft: "#3a212a",
  accentRing: "rgba(217, 120, 154, 0.22)",
  border: "#38362f",
  danger: "#e0392b",
  scheme: "dark",
};

export const radius = 10;

export function useTheme() {
  const systemScheme = useColorScheme();
  // useProfile() returns null when rendered outside a ProfileProvider (e.g. the
  // login screen, before a user is signed in) — system scheme wins there.
  const profileCtx = useProfile();
  const preference = profileCtx?.profile?.theme || "system";
  const scheme = preference === "system" ? systemScheme : preference;
  return scheme === "dark" ? dark : light;
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
