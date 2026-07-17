import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme, shadow } from "../theme";
import { useAuth } from "../lib/auth";
import { useProfile } from "../lib/profile";
import { notify } from "../lib/notify";
import { PrimaryButton } from "../components/Buttons";
import { TextField, ChipSelect } from "../components/Field";

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
        <ChipSelect value={profile.theme} onChange={(theme) => updateProfile({ theme })} options={THEME_OPTIONS} />
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
});
