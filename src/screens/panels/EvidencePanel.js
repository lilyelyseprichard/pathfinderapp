import React, { useState } from "react";
import { View, Text, Platform, Linking, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { useTheme } from "../../theme";
import { uuid } from "../../lib/id";
import { formatBytes, todayISO } from "../../lib/format";
import { notify, confirmDialog } from "../../lib/notify";
import * as fileStore from "../../lib/fileStore";
import { PrimaryButton, LinkButton } from "../../components/Buttons";
import { SectionHeader, EmptyState } from "../../components/Misc";
import { shadow } from "../../theme";

export function iconForType(type) {
  if (!type) return "📎";
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎞️";
  if (type === "application/pdf") return "📄";
  return "📎";
}

export async function openStoredFile(fileId) {
  const uri = await fileStore.getUri(fileId);
  if (!uri) {
    notify("Couldn't find that file's data.");
    return;
  }
  if (Platform.OS === "web") {
    window.open(uri, "_blank");
    return;
  }
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri);
  } else {
    Linking.openURL(uri).catch(() => notify("Couldn't open this file."));
  }
}

export default function EvidencePanel({ story, update }) {
  const c = useTheme();
  const [busy, setBusy] = useState(false);

  async function pickAndUpload() {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const fileId = uuid();
      await fileStore.putFromUri(fileId, asset.uri);
      update((s) => {
        s.documents.unshift({
          id: uuid(),
          name: asset.name || "Untitled file",
          type: asset.mimeType || "application/octet-stream",
          size: asset.size || 0,
          dateAdded: todayISO(),
          fileId,
        });
      });
    } catch (err) {
      notify("Couldn't add that file: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(id) {
    if (!(await confirmDialog("Delete this file?"))) return;
    const doc = story.documents.find((d) => d.id === id);
    if (doc) fileStore.remove(doc.fileId).catch(() => {});
    update((s) => {
      s.documents = s.documents.filter((d) => d.id !== id);
    });
  }

  return (
    <View>
      <SectionHeader
        label={`${story.documents.length} document${story.documents.length === 1 ? "" : "s"}`}
        action={<PrimaryButton title="+ Add File" onPress={pickAndUpload} disabled={busy} />}
      />
      {story.documents.length === 0 ? (
        <EmptyState>No documents yet. PDFs, photos, screenshots, budgets — anything supporting the story.</EmptyState>
      ) : (
        story.documents.map((d) => (
          <View key={d.id} style={[styles.row, shadow(c, "sm"), { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <Text style={styles.icon}>{iconForType(d.type)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "600" }} numberOfLines={1}>
                {d.name}
              </Text>
              <Text style={{ color: c.textDim, fontSize: 13 }}>
                {formatBytes(d.size)} · added {d.dateAdded}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <LinkButton title="Open" onPress={() => openStoredFile(d.fileId)} />
              <LinkButton title="Delete" onPress={() => deleteDocument(d.id)} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  icon: {
    fontSize: 22,
  },
});
