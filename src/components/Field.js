import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export function FieldLabel({ children }) {
  const c = useTheme();
  return <Text style={[styles.label, { color: c.textDim }]}>{children}</Text>;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  style,
  inputStyle,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}) {
  const c = useTheme();
  return (
    <View style={[styles.field, style]}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textDim}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          { color: c.text, backgroundColor: c.cardBg, borderColor: c.border },
          multiline && styles.multiline,
          inputStyle,
        ]}
      />
    </View>
  );
}

// Small enumerations (stage, method, type) as a row of selectable chips —
// avoids a native <select>/Picker dependency and behaves identically everywhere.
export function ChipSelect({ label, value, options, onChange, style }) {
  const c = useTheme();
  return (
    <View style={[styles.field, style]}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const optValue = typeof opt === "string" ? opt : opt.value;
          const optLabel = typeof opt === "string" ? opt : opt.label;
          const selected = optValue === value;
          return (
            <Pressable
              key={optValue}
              onPress={() => onChange(optValue)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? c.accent : c.cardBg,
                  borderColor: selected ? c.accent : c.border,
                },
              ]}
            >
              <Text style={{ color: selected ? "#fff" : c.text, fontSize: 13, fontWeight: selected ? "600" : "400" }}>
                {optLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    fontSize: 14,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1.5,
  },
});
