import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme, shadow } from "../theme";
import { useStories } from "../lib/storage";
import { notify } from "../lib/notify";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import { TextField, ChipSelect } from "../components/Field";
import { EmptyState } from "../components/Misc";
import ModalBox, { ModalActions } from "../components/Modal";

const STAGES = ["Research", "Interviewing", "Drafting", "Editing", "Published"];

function StoryCard({ story, onPress }) {
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
      <Text style={styles.emoji}>{story.emoji}</Text>
      <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>
        {story.title}
      </Text>
      <View style={[styles.stagePill, { backgroundColor: c.accentSoft }]}>
        <Text style={{ color: c.accent, fontSize: 12 }}>{story.stage}</Text>
      </View>
      <Text style={{ color: c.textDim, fontSize: 13 }}>
        {count} source{count === 1 ? "" : "s"}
      </Text>
    </Pressable>
  );
}

export default function DashboardScreen({ onOpenStory }) {
  const c = useTheme();
  const { stories, addStory, loaded } = useStories();
  const [visible, setVisible] = useState(false);
  const [emoji, setEmoji] = useState("📰");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("Research");

  function openModal() {
    setEmoji("📰");
    setTitle("");
    setStage("Research");
    setVisible(true);
  }

  function save() {
    if (!title.trim()) {
      notify("Give your story a title first.");
      return;
    }
    addStory({ emoji: emoji.trim() || "📰", title: title.trim(), stage });
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
            <StoryCard key={s.id} story={s} onPress={() => onOpenStory(s.id)} />
          ))}
        </View>
      )}

      <ModalBox visible={visible} onClose={() => setVisible(false)} title="New Story">
        <TextField label="Emoji" value={emoji} onChangeText={setEmoji} placeholder="📰" />
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. City Council Budget Investigation" />
        <ChipSelect label="Stage" value={stage} onChange={setStage} options={STAGES} />
        <ModalActions>
          <SecondaryButton title="Cancel" onPress={() => setVisible(false)} />
          <PrimaryButton title="Create Story" onPress={save} />
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
