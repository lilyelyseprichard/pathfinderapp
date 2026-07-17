import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth/react-native";
import { firebaseConfig, firebaseNotConfigured } from "./firebaseConfig";

export { firebaseNotConfigured };

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
