import * as Crypto from "expo-crypto";

// Static namespacing prefix — not a secret, just keeps this hash distinct from
// any other SHA-256 use in the app. The password itself is the real input.
const SALT = "pressroom-story-lock-v1:";

export function hashPassword(password) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, SALT + password);
}
