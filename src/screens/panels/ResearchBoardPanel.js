import React, { useState } from "react";
import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { useTheme, shadow } from "../../theme";
import { uuid } from "../../lib/id";
import { notify, confirmDialog } from "../../lib/notify";
import { PrimaryButton, SecondaryButton, LinkButton } from "../../components/Buttons";
import { TextField, ChipSelect } from "../../components/Field";
import { SectionHeader, EmptyState, HintBox } from "../../components/Misc";
import ModalBox, { ModalActions } from "../../components/Modal";
import { iconForType, openStoredFile } from "./EvidencePanel";

const TYPES = [
  { value: "note", label: "Note" },
  { value: "link", label: "Link" },
  { value: "stat", label: "Stat" },
  { value: "document", label: "File" },
];

function BoardItem({ item, story, onDelete }) {
  const c = useTheme();
  let body;
  if (item.type === "note") {
    body = <Text style={{ color: c.text, fontSize: 13 }}>{item.text}</Text>;
  } else if (item.type === "link") {
    body = (
      <Pressable onPress={() => Linking.openURL(item.url).catch(() => notify("Couldn't open that link."))}>
        <Text style={{ color: c.accent, fontSize: 13 }}>{item.label || item.url}</Text>
      </Pressable>
    );
  } else if (item.type === "stat") {
    body = (
      <View>
        <Text style={{ color: c.accent, fontSize: 20, fontWeight: "700" }}>{item.value}</Text>
        <Text style={{ color: c.textDim, fontSize: 12, marginTop: 2 }}>{item.label}</Text>
      </View>
    );
  } else if (item.type === "document") {
    const doc = story.documents.find((d) => d.id === item.docId);
    body = doc ? (
      <Pressable onPress={() => openStoredFile(doc.fileId)}>
        <Text style={{ color: c.text, fontSize: 13 }}>
          {iconForType(doc.type)} {doc.name}
        </Text>
      </Pressable>
    ) : (
      <Text style={{ color: c.textDim, fontSize: 12 }}>File no longer exists.</Text>
    );
  }

  return (
    <View style={[styles.card, shadow(c, "md"), { backgroundColor: c.cardBg, borderColor: c.border }]}>
      <View style={[styles.cardHeader, { borderBottomColor: c.border }]}>
        <Text style={{ color: c.textDim, fontSize: 12 }}>📌</Text>
        <Pressable onPress={onDelete}>
          <Text style={{ color: c.textDim, fontSize: 16 }}>×</Text>
        </Pressable>
      </View>
      <View style={styles.cardBody}>{body}</View>
    </View>
  );
}

export default function ResearchBoardPanel({ story, update }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState("note");
  const [noteText, setNoteText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [statValue, setStatValue] = useState("");
  const [statLabel, setStatLabel] = useState("");
  const [docId, setDocId] = useState("");

  function openModal() {
    setType("note");
    setNoteText("");
    setLinkUrl("");
    setLinkLabel("");
    setStatValue("");
    setStatLabel("");
    setDocId(story.documents[0] ? story.documents[0].id : "");
    setModalVisible(true);
  }

  function save() {
    const data = { type };
    if (type === "note") {
      if (!noteText.trim()) return notify("Write something in the note first.");
      data.text = noteText.trim();
    } else if (type === "link") {
      if (!linkUrl.trim()) return notify("Add a URL first.");
      data.url = linkUrl.trim();
      data.label = linkLabel.trim();
    } else if (type === "stat") {
      if (!statValue.trim()) return notify("Add the stat's value first.");
      data.value = statValue.trim();
      data.label = statLabel.trim();
    } else if (type === "document") {
      if (!docId) return notify("Upload a file in Evidence Locker first, then pin it here.");
      data.docId = docId;
    }
    update((s) => {
      s.board.push({ id: uuid(), ...data });
    });
    setModalVisible(false);
  }

  async function remove(id) {
    if (!(await confirmDialog("Remove this from the board?"))) return;
    update((s) => {
      s.board = s.board.filter((b) => b.id !== id);
    });
  }

  return (
    <View>
      <SectionHeader
        label={`${story.board.length} item${story.board.length === 1 ? "" : "s"}`}
        action={<PrimaryButton title="+ Pin to Board" onPress={openModal} />}
      />

      {story.board.length === 0 ? (
        <EmptyState>Nothing pinned yet. Pin notes, links, stats, or files from your Evidence Locker.</EmptyState>
      ) : (
        <View style={styles.grid}>
          {story.board.map((item) => (
            <BoardItem key={item.id} item={item} story={story} onDelete={() => remove(item.id)} />
          ))}
        </View>
      )}

      <ModalBox visible={modalVisible} onClose={() => setModalVisible(false)} title="Pin to Board">
        <ChipSelect label="Type" value={type} options={TYPES} onChange={setType} />
        {type === "note" ? (
          <TextField label="Note" value={noteText} onChangeText={setNoteText} placeholder="Write a note..." multiline />
        ) : null}
        {type === "link" ? (
          <>
            <TextField label="URL" value={linkUrl} onChangeText={setLinkUrl} placeholder="https://..." autoCapitalize="none" />
            <TextField label="Label" value={linkLabel} onChangeText={setLinkLabel} placeholder="What is this link?" />
          </>
        ) : null}
        {type === "stat" ? (
          <>
            <TextField label="Value" value={statValue} onChangeText={setStatValue} placeholder="$14 million" />
            <TextField label="Label" value={statLabel} onChangeText={setStatLabel} placeholder="What does this number mean?" />
          </>
        ) : null}
        {type === "document" ? (
          story.documents.length === 0 ? (
            <HintBox>No files uploaded yet. Add one in Evidence Locker first, then pin it here.</HintBox>
          ) : (
            <ChipSelect label="File" value={docId} options={story.documents.map((d) => ({ value: d.id, label: d.name }))} onChange={setDocId} />
          )
        ) : null}
        <ModalActions>
          <SecondaryButton title="Cancel" onPress={() => setModalVisible(false)} />
          <PrimaryButton title="Pin It" onPress={save} />
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
  },
  card: {
    width: 190,
    borderWidth: 1,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  cardBody: {
    padding: 12,
  },
});
