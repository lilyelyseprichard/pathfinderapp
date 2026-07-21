import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme, shadow } from "../theme";
import { useStories } from "../lib/storage";
import { notify, confirmDialog } from "../lib/notify";
import { hashPassword } from "../lib/lock";
import { computeStage } from "../lib/stage";
import { PrimaryButton, SecondaryButton, LinkButton } from "../components/Buttons";
import { TextField } from "../components/Field";
import { EmptyState, HintBox } from "../components/Misc";
import ModalBox, { ModalActions } from "../components/Modal";

function StoryCard({ story, onPress, onDelete, onLockToggle }) {
  const c = useTheme();
  const count = story.sources.length;
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.card,
        shadow(c, "sm"),
        { backgroundColor: c.cardBg, borderColor: hovered ? c.accent : c.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>
          {story.locked ? "🔒" : story.emoji}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <LinkButton
            title={story.locked ? "Unlock" : "Lock"}
            onPress={(e) => {
              e?.stopPropagation?.();
              onLockToggle();
            }}
          />
          <LinkButton
            title="Delete"
            onPress={(e) => {
              e?.stopPropagation?.();
              onDelete();
            }}
            danger
          />
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>
        {story.title}
      </Text>
      <View style={[styles.stagePill, { backgroundColor: c.accentSoft }]}>
        <Text style={{ color: c.accent, fontSize: 12 }}>{computeStage(story)}</Text>
      </View>
      <Text style={{ color: c.textDim, fontSize: 13 }}>
        {story.locked ? "Password protected" : `${count} source${count === 1 ? "" : "s"}`}
      </Text>
    </Pressable>
  );
}

export default function DashboardScreen({ onOpenStory }) {
  const c = useTheme();
  const { stories, addStory, deleteStory, mutateStory, loaded } = useStories();
  const [visible, setVisible] = useState(false);
  const [emoji, setEmoji] = useState("📰");
  const [title, setTitle] = useState("");

  const [passwordModal, setPasswordModal] = useState(null); // { mode: "set" | "remove" | "access", story }
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwError, setPwError] = useState("");
  const [unlockedIds, setUnlockedIds] = useState(() => new Set());

  async function handleDelete(story) {
    if (!(await confirmDialog(`Delete "${story.title}"? This can't be undone.`))) return;
    deleteStory(story.id);
  }

  function openPasswordModal(mode, story) {
    setPw1("");
    setPw2("");
    setPwError("");
    setPasswordModal({ mode, story });
  }

  function handleOpenStory(story) {
    if (!story.locked || unlockedIds.has(story.id)) {
      onOpenStory(story.id);
      return;
    }
    openPasswordModal("access", story);
  }

  function handleLockToggle(story) {
    openPasswordModal(story.locked ? "remove" : "set", story);
  }

  async function submitPasswordModal() {
    const { mode, story } = passwordModal;

    if (mode === "set") {
      if (!pw1) {
        setPwError("Enter a password.");
        return;
      }
      if (pw1 !== pw2) {
        setPwError("Passwords don't match.");
        return;
      }
      const passwordHash = await hashPassword(pw1);
      mutateStory(story.id, (s) => {
        s.locked = true;
        s.passwordHash = passwordHash;
      });
      setPasswordModal(null);
      return;
    }

    if (!pw1) {
      setPwError("Enter the password.");
      return;
    }
    const attemptHash = await hashPassword(pw1);
    if (attemptHash !== story.passwordHash) {
      setPwError("Incorrect password.");
      return;
    }
    if (mode === "remove") {
      mutateStory(story.id, (s) => {
        s.locked = false;
        s.passwordHash = null;
      });
    } else {
      setUnlockedIds((prev) => new Set(prev).add(story.id));
      onOpenStory(story.id);
    }
    setPasswordModal(null);
  }

  function openModal() {
    setEmoji("📰");
    setTitle("");
    setVisible(true);
  }

  function save() {
    if (!title.trim()) {
      notify("Give your story a title first.");
      return;
    }
    addStory({ emoji: emoji.trim() || "📰", title: title.trim() });
    setVisible(false);
  }

  if (!loaded) {
    return (
      <View style={[styles.loading, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.h2, { color: c.text }]}>Your Stories</Text>
        <PrimaryButton title="+ New Story" onPress={openModal} />
      </View>

      {stories.length === 0 ? (
        <EmptyState>No stories yet. Start your first investigation.</EmptyState>
      ) : (
        <View style={styles.grid}>
          {stories.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              onPress={() => handleOpenStory(s)}
              onDelete={() => handleDelete(s)}
              onLockToggle={() => handleLockToggle(s)}
            />
          ))}
        </View>
      )}

      <ModalBox visible={visible} onClose={() => setVisible(false)} title="New Story">
        <TextField label="Emoji" value={emoji} onChangeText={setEmoji} placeholder="📰" />
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. City Council Budget Investigation" />
        <HintBox>Stage isn't set by hand — it updates on its own as you add interviews, drafting, and citations.</HintBox>
        <ModalActions>
          <SecondaryButton title="Cancel" onPress={() => setVisible(false)} />
          <PrimaryButton title="Create Story" onPress={save} />
        </ModalActions>
      </ModalBox>

      <ModalBox
        visible={!!passwordModal}
        onClose={() => setPasswordModal(null)}
        title={
          passwordModal?.mode === "set"
            ? "Lock Story"
            : passwordModal?.mode === "remove"
            ? "Remove Lock"
            : "Enter Password"
        }
      >
        {passwordModal?.mode === "set" ? (
          <Text style={{ color: c.textDim, fontSize: 13, marginBottom: 14 }}>
            Set a password for "{passwordModal.story.title}". You'll need it to open this story again.
          </Text>
        ) : (
          <Text style={{ color: c.textDim, fontSize: 13, marginBottom: 14 }}>
            {passwordModal?.mode === "remove"
              ? `Enter the password for "${passwordModal?.story.title}" to remove its lock.`
              : `"${passwordModal?.story.title}" is locked. Enter the password to open it.`}
          </Text>
        )}
        <TextField
          label="Password"
          value={pw1}
          onChangeText={(v) => {
            setPw1(v);
            setPwError("");
          }}
          placeholder="Password"
          secureTextEntry
        />
        {passwordModal?.mode === "set" ? (
          <TextField
            label="Confirm Password"
            value={pw2}
            onChangeText={(v) => {
              setPw2(v);
              setPwError("");
            }}
            placeholder="Confirm password"
            secureTextEntry
          />
        ) : null}
        {pwError ? <Text style={{ color: c.danger, fontSize: 13, marginBottom: 4 }}>{pwError}</Text> : null}
        <ModalActions>
          <SecondaryButton title="Cancel" onPress={() => setPasswordModal(null)} />
          <PrimaryButton
            title={passwordModal?.mode === "set" ? "Lock Story" : passwordModal?.mode === "remove" ? "Remove Lock" : "Unlock"}
            onPress={submitPasswordModal}
          />
        </ModalActions>
      </ModalBox>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
    padding: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flexGrow: 1,
    flexBasis: 240,
    maxWidth: 320,
    borderRadius: 10,
    borderWidth: 1,
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  emoji: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  stagePill: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
});
