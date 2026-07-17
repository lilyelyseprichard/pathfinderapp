import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "./src/theme";
import { AuthProvider, useAuth } from "./src/lib/auth";
import { StoryProvider } from "./src/lib/storage";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import StoryWorkspaceScreen from "./src/screens/StoryWorkspaceScreen";
import TopBar from "./src/components/TopBar";

function MainApp({ userEmail, onSignOut }) {
  const [storyId, setStoryId] = useState(null);

  return (
    <View style={styles.flex}>
      <TopBar
        title="Pressroom"
        showBack={!!storyId}
        onBack={() => setStoryId(null)}
        userEmail={userEmail}
        onSignOut={onSignOut}
      />
      {storyId ? (
        <StoryWorkspaceScreen storyId={storyId} />
      ) : (
        <DashboardScreen onOpenStory={setStoryId} />
      )}
    </View>
  );
}

function AppShell() {
  const c = useTheme();
  const { user, loading, configured, signOutUser } = useAuth();

  if (configured && loading) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  if (configured && !user) {
    return <LoginScreen />;
  }

  const uid = configured ? user.uid : "local";
  const email = configured ? user.email || "" : "";

  return (
    <StoryProvider uid={uid}>
      <MainApp userEmail={email} onSignOut={configured ? signOutUser : null} />
    </StoryProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.flex}>
        <AppShell />
        <StatusBar style="auto" />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
});
