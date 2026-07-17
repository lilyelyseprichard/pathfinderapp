import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "./src/theme";
import { AuthProvider, useAuth } from "./src/lib/auth";
import { StoryProvider } from "./src/lib/storage";
import { ProfileProvider } from "./src/lib/profile";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import StoryWorkspaceScreen from "./src/screens/StoryWorkspaceScreen";
import AccountScreen from "./src/screens/AccountScreen";
import TopBar from "./src/components/TopBar";

function MainApp({ onSignOut }) {
  const [storyId, setStoryId] = useState(null);
  const [showAccount, setShowAccount] = useState(false);

  const title = showAccount ? "Account" : "Pressroom";
  const showBack = showAccount || !!storyId;
  const onBack = showAccount ? () => setShowAccount(false) : () => setStoryId(null);

  return (
    <View style={styles.flex}>
      <TopBar
        title={title}
        showBack={showBack}
        onBack={onBack}
        onOpenAccount={() => setShowAccount(true)}
        onSignOut={onSignOut}
      />
      {showAccount ? (
        <AccountScreen />
      ) : storyId ? (
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

  return (
    <StoryProvider uid={uid}>
      <ProfileProvider uid={uid}>
        <MainApp onSignOut={configured ? signOutUser : null} />
      </ProfileProvider>
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
