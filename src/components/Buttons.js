import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme, radius, shadow } from "../theme";

export function PrimaryButton({ title, onPress, style, disabled }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.base,
        shadow(c, "sm"),
        { backgroundColor: c.accent, opacity: disabled ? 0.5 : pressed || hovered ? 0.92 : 1 },
        style,
      ]}
    >
      <Text style={styles.primaryText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, style, disabled }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.base,
        { backgroundColor: c.cardBg, borderWidth: 1.5, borderColor: pressed || hovered ? c.accent : c.border, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={[styles.secondaryText, { color: c.text }]}>{title}</Text>
    </Pressable>
  );
}

export function LinkButton({ title, onPress, style, danger }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={style}>
      <Text style={{ color: danger ? c.danger : c.accent, fontSize: 14 }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  secondaryText: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});
