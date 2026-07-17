import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export function Tag({ children }) {
  const c = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: c.accentSoft }]}>
      <Text style={{ color: c.accent, fontSize: 11 }}>{children}</Text>
    </View>
  );
}

export function TagList({ tags }) {
  if (!tags || !tags.length) return null;
  return (
    <View style={styles.tagList}>
      {tags.map((t, i) => (
        <Tag key={i}>{t}</Tag>
      ))}
    </View>
  );
}

export function EmptyState({ children }) {
  const c = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={{ color: c.textDim, textAlign: "center" }}>{children}</Text>
    </View>
  );
}

export function HintBox({ children }) {
  const c = useTheme();
  return (
    <View style={[styles.hint, { borderColor: c.border }]}>
      <Text style={{ color: c.textDim, fontSize: 13 }}>{children}</Text>
    </View>
  );
}

export function SectionHeader({ label, action }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerLabel}>{label}</Text>
      {action}
    </View>
  );
}

export function SectionHeaderText({ children }) {
  const c = useTheme();
  return <Text style={{ color: c.textDim, fontSize: 13 }}>{children}</Text>;
}

const styles = StyleSheet.create({
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  empty: {
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  hint: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 13,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  headerLabel: {
    fontSize: 13,
  },
});
