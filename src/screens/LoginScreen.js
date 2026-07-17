import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useTheme, shadow } from "../theme";
import { TextField } from "../components/Field";
import { PrimaryButton } from "../components/Buttons";
import { useAuth } from "../lib/auth";

function notify(message) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Pressroom", message);
}

export default function LoginScreen() {
  const c = useTheme();
  const { signInEmail, signUpEmail, resetPassword, configured } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleEmailSubmit() {
    if (!email.trim() || !password) {
      notify("Enter both an email and a password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await signUpEmail(email.trim(), password);
        if (result?.needsConfirmation) {
          notify("Almost there — check your email to confirm your account, then sign in.");
          setMode("signin");
          setPassword("");
        }
      } else {
        await signInEmail(email.trim(), password);
      }
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      notify('Enter your email address first, then tap "Forgot password" again.');
      return;
    }
    try {
      await resetPassword(email.trim());
      notify("Password reset email sent to " + email.trim());
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.body, { backgroundColor: c.bg }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.card, shadow(c, "lg"), { backgroundColor: c.cardBg, borderColor: c.border }]}>
        <Text style={[styles.logo, { color: c.text }]}>📓 Pressroom</Text>

        <View style={[styles.modeToggle, { backgroundColor: c.bg, borderColor: c.border }]}>
          <Pressable
            onPress={() => setMode("signin")}
            style={[styles.modeBtn, mode === "signin" && [styles.modeBtnActive, shadow(c, "sm"), { backgroundColor: c.cardBg }]]}
          >
            <Text style={{ color: mode === "signin" ? c.text : c.textDim, fontWeight: mode === "signin" ? "600" : "500" }}>Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("signup")}
            style={[styles.modeBtn, mode === "signup" && [styles.modeBtnActive, shadow(c, "sm"), { backgroundColor: c.cardBg }]]}
          >
            <Text style={{ color: mode === "signup" ? c.text : c.textDim, fontWeight: mode === "signup" ? "600" : "500" }}>Sign Up</Text>
          </Pressable>
        </View>

        <View style={[styles.oauthBtn, styles.disabledBtn, { borderColor: c.border, backgroundColor: c.cardBg }]}>
          <Text style={{ color: c.textDim }}>🔵 Continue with Google</Text>
          <View style={[styles.soonTag, { backgroundColor: c.accentSoft }]}>
            <Text style={{ color: c.accent, fontSize: 11, fontWeight: "600" }}>Coming soon</Text>
          </View>
        </View>

        <View style={[styles.oauthBtn, styles.disabledBtn, { borderColor: c.border, backgroundColor: c.cardBg }]}>
          <Text style={{ color: c.textDim }}>Continue with Apple</Text>
          <View style={[styles.soonTag, { backgroundColor: c.accentSoft }]}>
            <Text style={{ color: c.accent, fontSize: 11, fontWeight: "600" }}>Coming soon</Text>
          </View>
        </View>

        <View style={[styles.oauthBtn, styles.disabledBtn, { borderColor: c.border, backgroundColor: c.cardBg }]}>
          <Text style={{ color: c.textDim }}>📱 Continue with phone</Text>
          <View style={[styles.soonTag, { backgroundColor: c.accentSoft }]}>
            <Text style={{ color: c.accent, fontSize: 11, fontWeight: "600" }}>Coming soon</Text>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          <Text style={{ color: c.textDim, fontSize: 12, marginHorizontal: 10 }}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View>
          <TextField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
          {mode === "signin" ? (
            <Pressable onPress={handleForgotPassword} style={styles.forgotLink}>
              <Text style={{ color: c.accent, fontSize: 13 }}>Forgot password?</Text>
            </Pressable>
          ) : null}
        </View>

        <PrimaryButton
          title={mode === "signin" ? "Sign In" : "Create Account"}
          onPress={handleEmailSubmit}
          disabled={busy}
          style={{ width: "100%", marginTop: 4 }}
        />

        {!configured ? (
          <Text style={[styles.setupNote, { color: c.textDim }]}>
            First time here? Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file — sign-in won't work
            until that's done.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
  },
  logo: {
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 26,
  },
  modeToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
    marginBottom: 22,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: "center",
  },
  modeBtnActive: {},
  oauthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  disabledBtn: {
    justifyContent: "space-between",
    opacity: 0.6,
  },
  soonTag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  forgotLink: {
    marginTop: -8,
    marginBottom: 16,
  },
  setupNote: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 22,
  },
});
