import React from "react";
import { View, Text, Image, Pressable, StyleSheet, Platform } from "react-native";
import { useTheme, shadow } from "../theme";
import { LinkButton, SecondaryButton } from "./Buttons";

const logo = require("../../assets/icon.png");

export default function TopBar({ title, showBack, onBack, onOpenAccount, onSignOut }) {
  const c = useTheme();
  return (
    <View style={[styles.bar, shadow(c, "sm"), { backgroundColor: c.cardBg, borderBottomColor: c.border }]}>
      {showBack ? <LinkButton title="← All Stories" onPress={onBack} style={styles.back} /> : <View style={styles.backSpacer} />}
      <View style={styles.titleRow}>
        <Image source={logo} style={styles.logo} />
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.user}>
        {onOpenAccount ? (
          <Pressable
            onPress={onOpenAccount}
            accessibilityLabel="Account"
            style={({ hovered }) => [
              styles.accountBtn,
              { borderColor: c.border, backgroundColor: hovered ? c.accentSoft : "transparent" },
            ]}
          >
            <Text style={{ fontSize: 15 }}>👤</Text>
          </Pressable>
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
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
