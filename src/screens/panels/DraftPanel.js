import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme, shadow } from "../../theme";
import { uuid } from "../../lib/id";
import { notify } from "../../lib/notify";
import { googleDocsConfigured, exportStoryToGoogleDoc } from "../../lib/googleDocs";
import { PrimaryButton, SecondaryButton, LinkButton } from "../../components/Buttons";
import { TextField } from "../../components/Field";
import { EmptyState, HintBox, SectionHeader } from "../../components/Misc";
import ModalBox, { ModalActions } from "../../components/Modal";

function iconForEvidenceType(type) {
  return { source: "👤", document: "📎", quote: "💬", timeline: "📅" }[type] || "🔗";
}

const TAB_FOR_TYPE = { source: "Sources", document: "Evidence Locker", quote: "Quote Bank", timeline: "Timeline" };

export default function DraftPanel({ story, update, setTab }) {
  const c = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerBlockId, setPickerBlockId] = useState(null);
  const [checked, setChecked] = useState({});
  const [exporting, setExporting] = useState(false);

  async function exportToGoogleDocs() {
    setExporting(true);
    try {
      const { url } = await exportStoryToGoogleDoc(story);
      notify("Exported to Google Docs.");
      window.open(url, "_blank");
    } catch (err) {
      notify("Couldn't export to Google Docs: " + err.message);
    } finally {
      setExporting(false);
    }
  }

  function addBlock() {
    update((s) => {
      s.draft.blocks.push({ id: uuid(), text: "", links: [] });
    });
  }

  function setBlockText(blockId, text) {
    update((s) => {
      s.draft.blocks.find((b) => b.id === blockId).text = text;
    });
  }

  function deleteBlock(blockId) {
    update((s) => {
      s.draft.blocks = s.draft.blocks.filter((b) => b.id !== blockId);
    });
  }

  function openPicker(blockId) {
    setPickerBlockId(blockId);
    const block = story.draft.blocks.find((b) => b.id === blockId);
    const initial = {};
    block.links.forEach((l) => {
      initial[l.type + ":" + l.id] = l;
    });
    setChecked(initial);
    setPickerVisible(true);
  }

  function toggleCheck(ref) {
    const key = ref.type + ":" + ref.id;
    setChecked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = ref;
      return next;
    });
  }

  function confirmPicker() {
    const refs = Object.values(checked);
    if (refs.length === 0) {
      notify("Pick at least one piece of evidence to link.");
      return;
    }
    update((s) => {
      s.draft.blocks.find((b) => b.id === pickerBlockId).links = refs;
    });
    setPickerVisible(false);
  }

  function jump(ref) {
    setTab(TAB_FOR_TYPE[ref.type]);
  }

  const sections = [];
  if (story.sources.length) sections.push({ title: "Sources", items: story.sources.map((s) => ({ type: "source", id: s.id, label: s.name })) });
  if (story.documents.length)
    sections.push({ title: "Evidence Locker", items: story.documents.map((d) => ({ type: "document", id: d.id, label: d.name })) });
  if (story.quotes.length)
    sections.push({
      title: "Quote Bank",
      items: story.quotes.map((q) => ({
        type: "quote",
        id: q.id,
        label: `"${q.text.slice(0, 40)}${q.text.length > 40 ? "…" : ""}" — ${q.speaker}`,
      })),
    });
  if (story.timeline.length)
    sections.push({ title: "Timeline", items: story.timeline.map((e) => ({ type: "timeline", id: e.id, label: `${e.date}: ${e.title}` })) });

  return (
    <View>
      {googleDocsConfigured ? (
        <SectionHeader
          label="Export"
          action={
            <SecondaryButton
              title={exporting ? "Exporting…" : "📄 Export to Google Docs"}
              onPress={exportToGoogleDocs}
              disabled={exporting || story.draft.blocks.length === 0}
            />
          }
        />
      ) : (
        <HintBox>
          Google Docs export is off. Create an OAuth client at console.cloud.google.com and add
          EXPO_PUBLIC_GOOGLE_CLIENT_ID to your .env to enable it.
        </HintBox>
      )}

      {story.draft.blocks.length === 0 ? (
        <EmptyState>No paragraphs yet. Add one to start drafting.</EmptyState>
      ) : (
        story.draft.blocks.map((block) => (
          <View key={block.id} style={[styles.block, shadow(c, "sm"), { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <TextField value={block.text} onChangeText={(t) => setBlockText(block.id, t)} multiline placeholder="Write a paragraph..." />
            {block.links.length > 0 ? (
              <View style={styles.chipRow}>
                {block.links.map((l, i) => (
                  <Pressable key={i} onPress={() => jump(l)} style={[styles.linkChip, { backgroundColor: c.accentSoft, borderColor: c.accent }]}>
                    <Text style={{ color: c.accent, fontSize: 12 }}>
                      {iconForEvidenceType(l.type)} {l.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: 16 }}>
              <LinkButton title="Link Evidence" onPress={() => openPicker(block.id)} />
              <LinkButton title="Delete paragraph" onPress={() => deleteBlock(block.id)} danger />
            </View>
          </View>
        ))
      )}

      <SecondaryButton title="+ Add Paragraph" onPress={addBlock} style={{ alignSelf: "flex-start" }} />

      <ModalBox visible={pickerVisible} onClose={() => setPickerVisible(false)} title="Link Evidence">
        {sections.length === 0 ? (
          <HintBox>Nothing to link yet. Add sources, documents, quotes, or timeline events first.</HintBox>
        ) : (
          sections.map((sec) => (
            <View key={sec.title} style={{ marginBottom: 14 }}>
              <Text style={[styles.groupTitle, { color: c.textDim }]}>{sec.title}</Text>
              {sec.items.map((item) => {
                const key = item.type + ":" + item.id;
                const isChecked = !!checked[key];
                return (
                  <Pressable key={key} onPress={() => toggleCheck(item)} style={styles.pickRow}>
                    <View style={[styles.checkbox, { borderColor: c.accent }, isChecked && { backgroundColor: c.accent }]}>
                      {isChecked ? <Text style={{ color: "#fff", fontSize: 11 }}>✓</Text> : null}
                    </View>
                    <Text style={{ flex: 1, color: c.text, fontSize: 14 }}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
        <ModalActions>
          <SecondaryButton title="Cancel" onPress={() => setPickerVisible(false)} />
          <PrimaryButton title="Link Selected" onPress={confirmPicker} />
        </ModalActions>
      </ModalBox>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  linkChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  groupTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
