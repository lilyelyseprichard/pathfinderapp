import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../theme";
import { useStories } from "../lib/storage";
import { computeStage } from "../lib/stage";
import { confirmDialog } from "../lib/notify";
import { LinkButton } from "../components/Buttons";

import SourcesPanel from "./panels/SourcesPanel";
import InterviewsPanel from "./panels/InterviewsPanel";
import EvidencePanel from "./panels/EvidencePanel";
import TimelinePanel from "./panels/TimelinePanel";
import QuoteBankPanel from "./panels/QuoteBankPanel";
import ResearchBoardPanel from "./panels/ResearchBoardPanel";
import DraftPanel from "./panels/DraftPanel";

const TABS = ["Sources", "Interviews", "Evidence Locker", "Timeline", "Quote Bank", "Bulletin Board", "Draft"];

export default function StoryWorkspaceScreen({ storyId }) {
  const c = useTheme();
  const { getStory, mutateStory } = useStories();
  const story = getStory(storyId);
  const [tab, setTab] = useState("Sources");

  const update = useCallback((fn) => mutateStory(storyId, fn), [mutateStory, storyId]);

  async function togglePublished() {
    if (!story.published) {
      if (!(await confirmDialog(`Mark "${story.title}" as published? This is the one thing Pressroom can't detect on its own.`))) return;
      update((s) => {
        s.published = true;
      });
      return;
    }
    if (!(await confirmDialog("Unpublish this story? Its stage will go back to tracking your progress automatically."))) return;
    update((s) => {
      s.published = false;
    });
  }

  if (!story) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.textDim }}>This story could not be found.</Text>
      </View>
    );
  }

  let panel;
  switch (tab) {
    case "Sources":
      panel = <SourcesPanel story={story} update={update} />;
      break;
    case "Interviews":
      panel = <InterviewsPanel story={story} update={update} />;
      break;
    case "Evidence Locker":
      panel = <EvidencePanel story={story} update={update} />;
      break;
    case "Timeline":
      panel = <TimelinePanel story={story} update={update} />;
      break;
    case "Quote Bank":
      panel = <QuoteBankPanel story={story} update={update} />;
      break;
    case "Bulletin Board":
      panel = <ResearchBoardPanel story={story} update={update} />;
      break;
    case "Draft":
      panel = <DraftPanel story={story} update={update} setTab={setTab} />;
      break;
    default:
      panel = null;
  }

  return (
    <ScrollView style={[styles.flex, { backgroundColor: c.bg }]} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{story.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>{story.title}</Text>
          <View style={styles.stageRow}>
            <View style={[styles.stagePill, { backgroundColor: c.accentSoft }]}>
              <Text style={{ color: c.accent, fontSize: 12 }}>{computeStage(story)}</Text>
            </View>
            <LinkButton title={story.published ? "Unpublish" : "Mark as Published"} onPress={togglePublished} />
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsRow, { borderBottomColor: c.border }]}>
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.tab}>
              <Text style={[styles.tabText, { color: active ? c.accent : c.textDim, fontWeight: active ? "600" : "500" }]}>{t}</Text>
              <View style={[styles.tabUnderline, active && { backgroundColor: c.accent }]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.panel}>{panel}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  container: {
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
    padding: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  emoji: { fontSize: 34 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stagePill: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  tabsRow: {
    flexGrow: 0,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabText: {
    fontSize: 14,
  },
  tabUnderline: {
    height: 2,
    marginTop: 10,
    borderRadius: 1,
  },
  panel: {
    minHeight: 200,
  },
});
