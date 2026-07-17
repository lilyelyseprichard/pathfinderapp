import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme, shadow, ACCENT_PRESETS, resolveAccentBase, isCustomAccent } from "../theme";
import { useAuth } from "../lib/auth";
import { useProfile } from "../lib/profile";
import { notify } from "../lib/notify";
import { PrimaryButton } from "../components/Buttons";
import { TextField, ChipSelect, FieldLabel } from "../components/Field";
import ColorWheel from "../components/ColorWheel";

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function AccountScreen() {
  const c = useTheme();
  const { user } = useAuth();
  const { profile, loaded, updateProfile } = useProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (loaded) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
    }
  }, [loaded, profile.firstName, profile.lastName]);

  function saveName() {
    updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
    notify("Saved.");
  }

  const accent = profile.accent || "maroon";
  const customSelected = isCustomAccent(accent);

  if (!loaded) {
    return (
      <View style={[styles.loading, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.h2, { color: c.text }]}>Account</Text>
      {user?.email ? <Text style={{ color: c.textDim, fontSize: 13, marginBottom: 20 }}>Signed in as {user.email}</Text> : null}

      <View style={[styles.card, shadow(c, "sm"), { backgroundColor: c.cardBg, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Your name</Text>
        <TextField label="First name" value={firstName} onChangeText={setFirstName} placeholder="Jane" />
        <TextField label="Last name" value={lastName} onChangeText={setLastName} placeholder="Doe" />
        <PrimaryButton title="Save" onPress={saveName} style={{ alignSelf: "flex-start" }} />
      </View>

      <View style={[styles.card, shadow(c, "sm"), { backgroundColor: c.cardBg, borderColor: c.border, marginTop: 20 }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Appearance</Text>
        <ChipSelect label="Theme" value={profile.theme} onChange={(theme) => updateProfile({ theme })} options={THEME_OPTIONS} />

        <FieldLabel>Color scheme</FieldLabel>
        <View style={styles.swatchRow}>
          {ACCENT_PRESETS.map((p) => {
            const selected = !customSelected && accent === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => updateProfile({ accent: p.key })}
                accessibilityLabel={p.label}
                style={[styles.swatch, { backgroundColor: p.base, borderColor: selected ? c.text : "transparent" }]}
              >
                {selected ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => updateProfile({ accent: customSelected ? accent : resolveAccentBase(accent) })}
            accessibilityLabel="Custom color"
            style={[styles.swatch, styles.customSwatch, { borderColor: customSelected ? c.text : "transparent" }]}
          >
            <Text style={{ fontSize: 16 }}>🎨</Text>
          </Pressable>
        </View>

        {customSelected ? (
          <ColorWheel
            value={resolveAccentBase(accent)}
            onChange={(hex) => updateProfile({ accent: hex }, { persist: false })}
            onCommit={(hex) => updateProfile({ accent: hex })}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    padding: 28,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 14,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  customSwatch: {
    backgroundColor: "#00000010",
  },
  check: {
    color: "#fff",
    fontWeight: "700",
  },
});
