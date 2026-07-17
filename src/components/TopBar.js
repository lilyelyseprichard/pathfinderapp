import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme, shadow } from "../theme";
import { LinkButton, SecondaryButton } from "./Buttons";

export default function TopBar({ title, showBack, onBack, userEmail, onSignOut }) {
  const c = useTheme();
  return (
    <View style={[styles.bar, shadow(c, "sm"), { backgroundColor: c.cardBg, borderBottomColor: c.border }]}>
      {showBack ? <LinkButton title="← All Stories" onPress={onBack} style={styles.back} /> : <View style={styles.backSpacer} />}
      <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.user}>
        {userEmail ? (
          <Text style={{ color: c.textDim, fontSize: 13 }} numberOfLines={1}>
            {userEmail}
          </Text>
        ) : null}
        {onSignOut ? <SecondaryButton title="Sign Out" onPress={onSignOut} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: Platform.OS === "web" ? 0 : 0,
  },
  back: {
    minWidth: 90,
  },
  backSpacer: {
    minWidth: 90,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
