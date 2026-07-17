import * as Crypto from "expo-crypto";

export function uuid() {
  if (Crypto.randomUUID) return Crypto.randomUUID();
  // Fallback v4 generator, only used if the native module is unavailable.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
