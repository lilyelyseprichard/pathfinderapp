import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, supabaseConfigured } from "./supabase";

const ProfileContext = createContext(null);

const DEFAULT_PROFILE = { firstName: "", lastName: "", theme: "system" };

function storageKey(uid) {
  return "pressroom-profile-v1-" + (uid || "local");
}

function fromDbRow(row) {
  return {
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    theme: row.theme || "system",
  };
}

function toDbRow(uid, profile) {
  return {
    id: uid,
    first_name: profile.firstName,
    last_name: profile.lastName,
    theme: profile.theme,
    updated_at: new Date().toISOString(),
  };
}

export function ProfileProvider({ uid, children }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const keyRef = useRef(storageKey(uid));

  useEffect(() => {
    keyRef.current = storageKey(uid);
    let cancelled = false;
    setLoaded(false);

    (async () => {
      if (supabaseConfigured) {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, theme")
          .eq("id", uid)
          .maybeSingle();
        if (cancelled) return;

        if (error) {
          console.error("Failed to load profile from Supabase:", error.message);
          setProfile(DEFAULT_PROFILE);
          setLoaded(true);
          return;
        }
        setProfile(data ? fromDbRow(data) : DEFAULT_PROFILE);
        setLoaded(true);
        return;
      }

      // Local-only fallback when Supabase isn't configured.
      const raw = await AsyncStorage.getItem(keyRef.current);
      if (cancelled) return;
      setProfile(raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // patch is a partial profile object (e.g. { theme: "dark" } or { firstName, lastName }).
  const updateProfile = useCallback(
    (patch) => {
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        if (supabaseConfigured) {
          supabase
            .from("profiles")
            .upsert(toDbRow(uid, next))
            .then(({ error }) => {
              if (error) console.error("Failed to save profile to Supabase:", error.message);
            });
        } else {
          AsyncStorage.setItem(keyRef.current, JSON.stringify(next));
        }
        return next;
      });
    },
    [uid]
  );

  return <ProfileContext.Provider value={{ profile, loaded, updateProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
