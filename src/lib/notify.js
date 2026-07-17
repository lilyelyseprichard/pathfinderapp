import { Alert, Platform } from "react-native";

export function notify(message) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Pressroom", message);
}

export function confirmDialog(message) {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => {
    Alert.alert("Pressroom", message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "OK", onPress: () => resolve(true) },
    ]);
  });
}

export function promptDialog(message, defaultValue = "") {
  if (Platform.OS === "web") return Promise.resolve(window.prompt(message, defaultValue));
  // React Native has no built-in prompt on Android; callers on native should use an inline TextField instead.
  return Promise.resolve(null);
}
