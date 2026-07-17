import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, firebaseNotConfigured } from "./firebase";

const AuthContext = createContext(null);

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "That email already has an account. Try signing in instead.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
};

function friendlyMessage(err) {
  return ERROR_MESSAGES[err.code] || err.message;
}

export function AuthProvider({ children }) {
  const configured = !firebaseNotConfigured();
  const [user, setUser] = useState(configured ? null : { uid: "local", email: "" });
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [configured]);

  const signInEmail = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(friendlyMessage(err));
    }
  }, []);

  const signUpEmail = useCallback(async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(friendlyMessage(err));
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    if (Platform.OS !== "web") {
      throw new Error("Google sign-in is only available in the web version for now.");
    }
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      throw new Error("Google sign-in failed: " + friendlyMessage(err));
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw new Error(friendlyMessage(err));
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!configured) return;
    await fbSignOut(auth);
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
