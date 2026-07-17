import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../theme";
import { uuid } from "../../lib/id";
import { notify, confirmDialog } from "../../lib/notify";
import { PrimaryButton, SecondaryButton, LinkButton } from "../../components/Buttons";
import { TextField, ChipSelect } from "../../components/Field";
import { SectionHeader, EmptyState, HintBox, Tag } from "../../components/Misc";
import ModalBox, { ModalActions } from "../../components/Modal";

const TYPES = [
  { value: "event", label: "Story event" },
  { value: "milestone", label: "Milestone" },
];

const emptyForm = { type: "event", date: "", title: "", description: "", done: false };

function ProgressBar({ story, events }) {
  const c = useTheme();
  const start = new Date(story.timelineStart);
  const deadline = new Date(story.timelineDeadline);
  const today = new Date();
  const totalMs = deadline - start;

  const percent = (d) => {
    if (totalMs <= 0) return 0;
    return Math.min(100, Math.max(0, ((d - start) / totalMs) * 100));
  };

  const todayPercent = percent(today);
  const dated = events.filter((e) => e.date);

  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
        <View style={[styles.progressFill, { backgroundColor: c.accent, width: `${todayPercent}%` }]} />
        <View style={[styles.progressToday, { backgroundColor: c.text, left: `${todayPercent}%` }]} />
        {dated.map((e) => (
          <View
            key={e.id}
            style={[
              styles.progressDot,
              {
                left: `${percent(new Date(e.date))}%`,
                backgroundColor: e.type === "milestone" ? c.accent : c.cardBg,
                borderColor: e.type === "milestone" ? c.accent : c.textDim,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.progressEndpoints}>
        <Text style={{ color: c.textDim, fontSize: 12 }}>{story.timelineStart}</Text>
        <Text style={{ color: c.textDim, fontSize: 12 }}>{story.timelineDeadline}</Text>
      </View>
    </View>
  );
}

function TimelineItem({ event, onToggleDone, onEdit, onDelete }) {
  const c = useTheme();
  const isMilestone = event.type === "milestone";
  return (
    <View style={styles.item}>
      {isMilestone ? (
        <Pressable
          onPress={() => onToggleDone(event.id)}
          style={[
            styles.check,
            { borderColor: c.accent, backgroundColor: event.done ? c.accent : c.cardBg },
          ]}
        >
          {event.done ? <Text style={{ color: "#fff", fontSize: 11 }}>✓</Text> : null}
        </Pressable>
      ) : (
        <View style={[styles.dot, { backgroundColor: c.accent }]} />
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.dateRow}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: "600" }}>{event.date || "No date"}</Text>
          {isMilestone ? <Tag>Milestone</Tag> : null}
        </View>
        <Text
          style={{
            color: event.done ? c.textDim : c.text,
            fontSize: 15,
            fontWeight: "600",
            textDecorationLine: event.done ? "line-through" : "none",
          }}
        >
          {event.title}
        </Text>
        {event.description ? <Text style={{ color: c.textDim, fontSize: 13, marginTop: 2 }}>{event.description}</Text> : null}
        <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
          <LinkButton title="Edit" onPress={() => onEdit(event.id)} />
          <LinkButton title="Delete" onPress={() => onDelete(event.id)} />
        </View>
      </View>
    </View>
  );
}

export default function TimelinePanel({ story, update }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [rangeVisible, setRangeVisible] = useState(false);
  const [rangeStart, setRangeStart] = useState(story.timelineStart);
  const [rangeDeadline, setRangeDeadline] = useState(story.timelineDeadline);

  const events = [...story.timeline].sort((a, b) => (a.date < b.date ? -1 : 1));
  const hasRange = story.timelineStart && story.timelineDeadline;

  function openModal(id) {
    setEditingId(id || null);
    if (id) {
      const e = story.timeline.find((x) => x.id === id);
      setForm({ type: e.type, date: e.date, title: e.title, description: e.description, done: e.done });
    } else {
      setForm(emptyForm);
    }
    setModalVisible(true);
  }

  function save() {
    const title = form.title.trim();
    if (!title) {
      notify("Give this event a short title first.");
      return;
    }
    const data = { type: form.type, date: form.date.trim(), title, description: form.description.trim(), done: !!form.done };
    update((s) => {
      if (editingId) {
        Object.assign(
          s.timeline.find((e) => e.id === editingId),
          data
        );
      } else {
        s.timeline.push({ id: uuid(), ...data });
      }
    });
    setModalVisible(false);
  }

  function toggleDone(id) {
    update((s) => {
      const e = s.timeline.find((x) => x.id === id);
      e.done = !e.done;
    });
  }

  async function remove(id) {
    if (!(await confirmDialog("Delete this event?"))) return;
    update((s) => {
      s.timeline = s.timeline.filter((e) => e.id !== id);
    });
  }

  function openRangeModal() {
    setRangeStart(story.timelineStart);
    setRangeDeadline(story.timelineDeadline);
    setRangeVisible(true);
  }

  function saveRange() {
    if (!rangeStart.trim() || !rangeDeadline.trim()) {
      notify("Set both a start date and a deadline.");
      return;
    }
    if (rangeDeadline.trim() < rangeStart.trim()) {
      notify("The deadline should be after the start date.");
      return;
    }
    update((s) => {
      s.timelineStart = rangeStart.trim();
      s.timelineDeadline = rangeDeadline.trim();
    });
    setRangeVisible(false);
  }

  return (
    <View>
      <SectionHeader
        label={`${events.length} event${events.length === 1 ? "" : "s"}`}
        action={
          <View style={{ flexDirection: "row", gap: 10 }}>
            <SecondaryButton title={hasRange ? "Edit Dates" : "Set Start & Deadline"} onPress={openRangeModal} />
            <PrimaryButton title="+ Add Event" onPress={() => openModal()} />
          </View>
        }
      />

      {hasRange ? (
        <ProgressBar story={story} events={events} />
      ) : (
        <HintBox>Set a start date and deadline to see the full progress timeline.</HintBox>
      )}

      {events.length === 0 ? (
        <EmptyState>No events yet. Add key dates and milestones — they'll be sorted automatically.</EmptyState>
      ) : (
        events.map((e) => <TimelineItem key={e.id} event={e} onToggleDone={toggleDone} onEdit={openModal} onDelete={remove} />)
      )}

      <ModalBox visible={modalVisible} onClose={() => setModalVisible(false)} title={editingId ? "Edit Event" : "Add Event"}>
        <ChipSelect label="Type" value={form.type} options={TYPES} onChange={(v) => setForm((f) => ({ ...f, type: v }))} />
        <TextField label="Date" value={form.date} onChangeText={(v) => setForm((f) => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" />
        <TextField
          label="Title"
          value={form.title}
          onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
          placeholder="e.g. City approves construction contract"
        />
        <TextField
          label="Description"
          value={form.description}
          onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          placeholder="Optional details..."
          multiline
        />
        {form.type === "milestone" ? (
          <Pressable onPress={() => setForm((f) => ({ ...f, done: !f.done }))} style={styles.doneField}>
            <View style={[styles.checkboxBox, form.done && { backgroundColor: "#7c2140" }]}>
              {form.done ? <Text style={{ color: "#fff", fontSize: 11 }}>✓</Text> : null}
            </View>
            <Text>Completed</Text>
          </Pressable>
        ) : null}
        <ModalActions>
          <SecondaryButton title="Cancel" onPress={() => setModalVisible(false)} />
          <PrimaryButton title="Save Event" onPress={save} />
        </ModalActions>
      </ModalBox>

      <ModalBox visible={rangeVisible} onClose={() => setRangeVisible(false)} title="Set Timeline Range">
        <TextField label="Story start date" value={rangeStart} onChangeText={setRangeStart} placeholder="YYYY-MM-DD" />
        <TextField label="Deadline" value={rangeDeadline} onChangeText={setRangeDeadline} placeholder="YYYY-MM-DD" />
        <ModalActions>
          <SecondaryButton title="Cancel" onPress={() => setRangeVisible(false)} />
          <PrimaryButton title="Save" onPress={saveRange} />
        </ModalActions>
      </ModalBox>
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    marginBottom: 28,
    paddingHorizontal: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    marginVertical: 20,
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    borderRadius: 4,
  },
  progressToday: {
    position: "absolute",
    top: -6,
    width: 2,
    height: 18,
  },
  progressDot: {
    position: "absolute",
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginLeft: -5,
  },
  progressEndpoints: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  doneField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#7c2140",
    alignItems: "center",
    justifyContent: "center",
  },
});
