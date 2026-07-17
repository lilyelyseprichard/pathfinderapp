import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { firebaseConfig, firebaseNotConfigured } from "./firebaseConfig";

export { firebaseNotConfigured };

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

if (!firebaseNotConfigured()) {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}
