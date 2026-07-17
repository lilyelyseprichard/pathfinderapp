import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import { supabase, supabaseConfigured } from "./supabase";

const AuthContext = createContext(null);

const MESSAGE_OVERRIDES = [
  [/invalid login credentials/i, "Incorrect email or password."],
  [/user already registered/i, "That email already has an account. Try signing in instead."],
  [/email not confirmed/i, "Confirm your email first — check your inbox for the confirmation link."],
  [/password should be at least/i, "Password should be at least 6 characters."],
  [/unable to validate email address/i, "That doesn't look like a valid email address."],
  [/email rate limit exceeded|over_email_send_rate_limit/i, "Too many attempts — wait a moment and try again."],
];

function friendlyMessage(err) {
  const raw = err?.message || "Something went wrong.";
  const match = MESSAGE_OVERRIDES.find(([pattern]) => pattern.test(raw));
  return match ? match[1] : raw;
}

function mapUser(sessionUser) {
  if (!sessionUser) return null;
  return { uid: sessionUser.id, email: sessionUser.email || "" };
}

export function AuthProvider({ children }) {
  const configured = supabaseConfigured;
  const [user, setUser] = useState(configured ? null : { uid: "local", email: "" });
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(mapUser(data.session?.user));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user));
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, [configured]);

  const signInEmail = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyMessage(error));
  }, []);

  const signUpEmail = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(friendlyMessage(error));
    return { needsConfirmation: !data.session };
  }, []);

  const signInGoogle = useCallback(async () => {
    if (Platform.OS !== "web") {
      throw new Error("Google sign-in is only available in the web version for now.");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) throw new Error("Google sign-in failed: " + friendlyMessage(error));
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(friendlyMessage(error));
  }, []);

  const signOutUser = useCallback(async () => {
    if (!configured) return;
    await supabase.auth.signOut();
  }, [configured]);

  return (
    <AuthContext.Provider
      value={{ user, loading, configured, signInEmail, signUpEmail, signInGoogle, resetPassword, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
