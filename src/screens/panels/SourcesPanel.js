import React, { useState } from "react";
import { View, Text } from "react-native";
import { uuid } from "../../lib/id";
import { notify, confirmDialog } from "../../lib/notify";
import { useTheme } from "../../theme";
import { PrimaryButton, SecondaryButton, LinkButton } from "../../components/Buttons";
import { TextField, ChipSelect } from "../../components/Field";
import { SectionHeader } from "../../components/Misc";
import { EmptyState, TagList } from "../../components/Misc";
import { ListRow, DetailCard, DetailRow } from "../../components/Detail";
import ModalBox, { ModalActions } from "../../components/Modal";

const METHODS = ["Email", "Phone", "Text", "In person"];

const emptyForm = { name: "", org: "", position: "", contact: "", method: "Email", tags: "", notes: "" };

function SourceHeader({ name, tags }) {
  const c = useTheme();
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: c.text }}>{name}</Text>
      <TagList tags={tags} />
    </View>
  );
}

export default function SourcesPanel({ story, update }) {
  const [viewingId, setViewingId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  function openModal(id) {
    setEditingId(id || null);
    if (id) {
      const src = story.sources.find((s) => s.id === id);
      setForm({
        name: src.name,
        org: src.org,
        position: src.position,
        contact: src.contact,
        method: src.method,
        tags: src.tags.join(", "),
        notes: src.notes,
      });
    } else {
      setForm(emptyForm);
    }
    setModalVisible(true);
  }

  function save() {
    const name = form.name.trim();
    if (!name) {
      notify("Give this source a name first.");
      return;
    }
    const data = {
      name,
      org: form.org.trim(),
      position: form.position.trim(),
      contact: form.contact.trim(),
      method: form.method,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: form.notes.trim(),
    };
    update((s) => {
      if (editingId) {
        Object.assign(
          s.sources.find((x) => x.id === editingId),
          data
        );
      } else {
        s.sources.push({ id: uuid(), ...data });
      }
    });
    setModalVisible(false);
  }

  async function remove(id) {
    if (!(await confirmDialog("Delete this source?"))) return;
    update((s) => {
      s.sources = s.sources.filter((x) => x.id !== id);
    });
    setViewingId(null);
  }

  const viewing = viewingId ? story.sources.find((s) => s.id === viewingId) : null;

  const modal = (
    <ModalBox visible={modalVisible} onClose={() => setModalVisible(false)} title={editingId ? "Edit Source" : "New Source"}>
      <TextField label="Name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Jane Doe" />
      <TextField label="Organization" value={form.org} onChangeText={(v) => setForm((f) => ({ ...f, org: v }))} placeholder="City Council" />
      <TextField
        label="Position"
        value={form.position}
        onChangeText={(v) => setForm((f) => ({ ...f, position: v }))}
        placeholder="Budget Director"
      />
      <TextField
        label="Contact info"
        value={form.contact}
        onChangeText={(v) => setForm((f) => ({ ...f, contact: v }))}
        placeholder="jane@email.com / 555-1234"
      />
      <ChipSelect label="Preferred contact method" value={form.method} options={METHODS} onChange={(v) => setForm((f) => ({ ...f, method: v }))} />
      <TextField
        label="Tags"
        value={form.tags}
        onChangeText={(v) => setForm((f) => ({ ...f, tags: v }))}
        placeholder="Government, Expert (comma separated)"
      />
      <TextField
        label="Notes"
        value={form.notes}
        onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
        placeholder="Anything worth remembering..."
        multiline
      />
      <ModalActions>
        <SecondaryButton title="Cancel" onPress={() => setModalVisible(false)} />
        <PrimaryButton title="Save Source" onPress={save} />
      </ModalActions>
    </ModalBox>
  );

  if (viewing) {
    return (
      <View>
        <LinkButton title="← Back to sources" onPress={() => setViewingId(null)} />
        <DetailCard>
          <SourceHeader name={viewing.name} tags={viewing.tags} />
          <DetailRow label="Organization" value={viewing.org} />
          <DetailRow label="Position" value={viewing.position} />
          <DetailRow label="Contact" value={viewing.contact} />
          <DetailRow label="Preferred contact method" value={viewing.method} />
          <DetailRow label="Notes" value={viewing.notes} />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            <SecondaryButton title="Edit" onPress={() => openModal(viewing.id)} />
            <SecondaryButton title="Delete" onPress={() => remove(viewing.id)} />
          </View>
        </DetailCard>
        {modal}
      </View>
    );
  }

  return (
    <View>
      <SectionHeader
        label={`${story.sources.length} source${story.sources.length === 1 ? "" : "s"}`}
        action={<PrimaryButton title="+ Add Source" onPress={() => openModal()} />}
      />
      {story.sources.length === 0 ? (
        <EmptyState>No sources yet for this story.</EmptyState>
      ) : (
        story.sources.map((s) => (
          <ListRow
            key={s.id}
            title={s.name}
            subtitle={[s.position, s.org].filter(Boolean).join(" · ")}
            tags={s.tags}
            onPress={() => setViewingId(s.id)}
          />
        ))
      )}
      {modal}
    </View>
  );
}
