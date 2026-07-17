import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, shadow } from "../../theme";
import { uuid } from "../../lib/id";
import { notify, confirmDialog } from "../../lib/notify";
import { PrimaryButton, SecondaryButton, LinkButton } from "../../components/Buttons";
import { TextField, ChipSelect } from "../../components/Field";
import { SectionHeader, EmptyState, TagList } from "../../components/Misc";
import ModalBox, { ModalActions } from "../../components/Modal";

const emptyForm = { speaker: "", text: "", date: "", tags: "" };

export default function QuoteBankPanel({ story, update }) {
  const c = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterSpeaker, setFilterSpeaker] = useState("");
  const [filterText, setFilterText] = useState("");

  const speakers = [...new Set(story.quotes.map((q) => q.speaker))].sort();
  let quotes = story.quotes;
  if (filterSpeaker) quotes = quotes.filter((q) => q.speaker === filterSpeaker);
  if (filterText.trim()) {
    const q = filterText.trim().toLowerCase();
    quotes = quotes.filter((x) => x.text.toLowerCase().includes(q) || x.speaker.toLowerCase().includes(q));
  }

  function openModal(id) {
    setEditingId(id || null);
    if (id) {
      const q = story.quotes.find((x) => x.id === id);
      setForm({ speaker: q.speaker, text: q.text, date: q.date || "", tags: q.tags.join(", ") });
    } else {
      setForm(emptyForm);
    }
    setModalVisible(true);
  }

  function save() {
    const speaker = form.speaker.trim();
    const text = form.text.trim();
    if (!speaker || !text) {
      notify("A quote needs both a speaker and the quote text.");
      return;
    }
    const data = {
      speaker,
      text,
      date: form.date.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    update((s) => {
      if (editingId) {
        Object.assign(
          s.quotes.find((q) => q.id === editingId),
          data
        );
      } else {
        s.quotes.unshift({ id: uuid(), ...data });
      }
    });
    setModalVisible(false);
  }

  async function remove(id) {
    if (!(await confirmDialog("Delete this quote?"))) return;
    update((s) => {
      s.quotes = s.quotes.filter((q) => q.id !== id);
    });
  }

  return (
    <View>
      <SectionHeader
        label={`${story.quotes.length} quote${story.quotes.length === 1 ? "" : "s"}`}
        action={<PrimaryButton title="+ Add Quote" onPress={() => openModal()} />}
      />

      {speakers.length > 0 ? (
        <ChipSelect
          value={filterSpeaker}
          options={[{ value: "", label: "All speakers" }, ...speakers.map((s) => ({ value: s, label: s }))]}
          onChange={setFilterSpeaker}
        />
      ) : null}
      <TextField value={filterText} onChangeText={setFilterText} placeholder="Search quotes..." />

      {quotes.length === 0 ? (
        <EmptyState>No quotes match yet.</EmptyState>
      ) : (
        <View style={styles.grid}>
          {quotes.map((q) => (
            <View key={q.id} style={[styles.card, shadow(c, "sm"), { backgroundColor: c.cardBg, borderColor: c.border }]}>
              <Text style={[styles.quoteText, { color: c.text }]}>&ldquo;{q.text}&rdquo;</Text>
              <Text style={{ color: c.textDim, fontSize: 12 }}>
                <Text style={{ fontWeight: "700" }}>{q.speaker}</Text>
                {q.date ? " · " + q.date : ""}
              </Text>
              <TagList tags={q.tags} />
              <View style={{ flexDirection: "row", gap: 14, marginTop: 12 }}>
                <LinkButton title="Edit" onPress={() => openModal(q.id)} />
                <LinkButton title="Delete" onPress={() => remove(q.id)} />
              </View>
            </View>
          ))}
        </View>
      )}

      <ModalBox visible={modalVisible} onClose={() => setModalVisible(false)} title={editingId ? "Edit Quote" : "Add Quote"}>
        <TextField label="Speaker" value={form.speaker} onChangeText={(v) => setForm((f) => ({ ...f, speaker: v }))} placeholder="Jane Alvarez" />
        <TextField
          label="Quote"
          value={form.text}
          onChangeText={(v) => setForm((f) => ({ ...f, text: v }))}
          placeholder="What did they say?"
          multiline
        />
        <TextField label="Date" value={form.date} onChangeText={(v) => setForm((f) => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" />
        <TextField
          label="Tags"
          value={form.tags}
          onChangeText={(v) => setForm((f) => ({ ...f, tags: v }))}
          placeholder="Government, Follow-up needed (comma separated)"
        />
        <ModalActions>
          <SecondaryButton title="Cancel" onPress={() => setModalVisible(false)} />
          <PrimaryButton title="Save Quote" onPress={save} />
        </ModalActions>
      </ModalBox>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 16,
  },
  card: {
    flexGrow: 1,
    flexBasis: 220,
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
  },
  quoteText: {
    fontSize: 15,
    marginBottom: 10,
  },
});
