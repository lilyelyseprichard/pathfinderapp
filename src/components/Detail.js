import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme, shadow } from "../theme";
import { TagList } from "./Misc";

export function ListRow({ onPress, title, subtitle, meta, tags }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.row,
        shadow(c, "sm"),
        { backgroundColor: c.cardBg, borderColor: hovered ? c.accent : c.border },
      ]}
    >
      <View style={styles.rowHeader}>
        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: c.textDim, fontSize: 13 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? <Text style={{ color: c.textDim, fontSize: 13, marginTop: 4 }}>{meta}</Text> : null}
      <TagList tags={tags} />
    </Pressable>
  );
}

export function DetailCard({ children }) {
  const c = useTheme();
  return <View style={[styles.detail, shadow(c, "sm"), { backgroundColor: c.cardBg, borderColor: c.border }]}>{children}</View>;
}

export function DetailRow({ label, value }) {
  const c = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: c.textDim }]}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 14 }}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  detail: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    marginTop: 14,
  },
  detailRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
});
