import React from "react";
import { Modal as RNModal, View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useTheme, shadow } from "../theme";

export default function Modal({ visible, onClose, title, children, maxWidth = 440 }) {
  const c = useTheme();
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.box, shadow(c, "lg"), { backgroundColor: c.cardBg, maxWidth }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {title ? <Text style={[styles.title, { color: c.text }]}>{title}</Text> : null}
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

export function ModalActions({ children }) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  box: {
    width: "100%",
    maxHeight: "90%",
    borderRadius: 14,
    padding: 24,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
});
