import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useTheme } from "../../theme";
import { uuid } from "../../lib/id";
import { formatDuration, todayISO } from "../../lib/format";
import { notify, confirmDialog } from "../../lib/notify";
import * as fileStore from "../../lib/fileStore";
import { PrimaryButton, SecondaryButton, LinkButton } from "../../components/Buttons";
import { TextField } from "../../components/Field";
import { SectionHeader, EmptyState, HintBox } from "../../components/Misc";
import { ListRow, DetailCard } from "../../components/Detail";
import ModalBox, { ModalActions } from "../../components/Modal";

function AudioControls({ uri }) {
  const c = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  return (
    <View style={styles.audioRow}>
      <SecondaryButton
        title={status.playing ? "⏸ Pause" : "▶ Play recording"}
        onPress={() => (status.playing ? player.pause() : player.play())}
      />
      <Text style={{ color: c.textDim, fontSize: 13 }}>
        {formatDuration(status.currentTime || 0)} / {formatDuration(status.duration || 0)}
      </Text>
    </View>
  );
}

function InterviewAudioPlayer({ recordingId }) {
  const [uri, setUri] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUri(null);
    setChecked(false);
    if (!recordingId) {
      setChecked(true);
      return;
    }
    fileStore
      .getUri(recordingId)
      .then((u) => {
        if (!cancelled) {
          setUri(u);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [recordingId]);

  if (!checked) return null;
  if (!uri) return <HintBox>No audio saved for this interview.</HintBox>;
  return <AudioControls uri={uri} />;
}

export default function InterviewsPanel({ story, update }) {
  const c = useTheme();
  const [viewingId, setViewingId] = useState(null);
  const [phase, setPhase] = useState("list"); // list | setup | recording
  const [setupTitle, setSetupTitle] = useState("");
  const [pendingTitle, setPendingTitle] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [search, setSearch] = useState("");
  const [lineModalVisible, setLineModalVisible] = useState(false);
  const [lineSpeaker, setLineSpeaker] = useState("");
  const [lineText, setLineText] = useState("");

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: "document" });
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startInterviewSetup() {
    setSetupTitle("");
    setPhase("setup");
  }

  function cancelSetup() {
    setPhase("list");
  }

  async function beginRecording() {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        notify("Microphone permission is required to record an interview.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      notify("Couldn't start recording: " + err.message);
      return;
    }

    setPendingTitle(setupTitle.trim() || "Untitled Interview");
    startTimeRef.current = Date.now();
    setElapsedSec(0);
    timerRef.current = setInterval(() => {
      setElapsedSec((Date.now() - startTimeRef.current) / 1000);
    }, 1000);
    setPhase("recording");
  }

  async function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const durationSec = (Date.now() - startTimeRef.current) / 1000;

    let recordingId = null;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        recordingId = uuid();
        await fileStore.putFromUri(recordingId, uri);
      }
    } catch (err) {
      notify("The recording couldn't be saved: " + err.message);
    }

    const interview = {
      id: uuid(),
      title: pendingTitle,
      date: todayISO(),
      durationSec,
      recordingId,
      transcript: [],
    };
    update((s) => {
      s.interviews.unshift(interview);
    });
    setPhase("list");
    setViewingId(interview.id);
  }

  async function deleteInterview(id) {
    if (!(await confirmDialog("Delete this interview and its recording?"))) return;
    const interview = story.interviews.find((i) => i.id === id);
    if (interview && interview.recordingId) fileStore.remove(interview.recordingId).catch(() => {});
    update((s) => {
      s.interviews = s.interviews.filter((i) => i.id !== id);
    });
    setViewingId(null);
  }

  function openLineModal() {
    setLineSpeaker("");
    setLineText("");
    setLineModalVisible(true);
  }

  function saveLine() {
    const text = lineText.trim();
    if (!text) {
      notify("Enter what they said first.");
      return;
    }
    update((s) => {
      const interview = s.interviews.find((i) => i.id === viewingId);
      interview.transcript.push({
        id: uuid(),
        time: interview.durationSec || 0,
        speaker: lineSpeaker.trim() || "Speaker",
        text,
      });
    });
    setLineModalVisible(false);
  }

  function saveAsQuote(interview, segment) {
    update((s) => {
      s.quotes.unshift({ id: uuid(), speaker: segment.speaker, text: segment.text, date: interview.date, tags: [] });
    });
    notify("Saved to Quote Bank.");
  }

  if (phase === "setup") {
    return (
      <DetailCard>
        <Text style={{ fontSize: 18, fontWeight: "700", color: c.text, marginBottom: 14 }}>New Interview</Text>
        <TextField label="Title" value={setupTitle} onChangeText={setSetupTitle} placeholder="e.g. Interview with Jane Alvarez" />
        <HintBox>
          Recording captures audio only — add transcript lines by hand from the interview detail view afterward.
        </HintBox>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <PrimaryButton title="Start Recording" onPress={beginRecording} />
          <SecondaryButton title="Cancel" onPress={cancelSetup} />
        </View>
      </DetailCard>
    );
  }

  if (phase === "recording") {
    return (
      <DetailCard>
        <View style={styles.recStatus}>
          <View style={styles.recDot} />
          <Text style={{ color: c.text, fontWeight: "600" }}>Recording {formatDuration(elapsedSec)}</Text>
        </View>
        <PrimaryButton title="Stop & Save" onPress={stopRecording} />
      </DetailCard>
    );
  }

  const viewing = viewingId ? story.interviews.find((i) => i.id === viewingId) : null;

  if (viewing) {
    const q = search.trim().toLowerCase();
    const lines = viewing.transcript.filter((seg) => !q || (seg.speaker + " " + seg.text).toLowerCase().includes(q));

    return (
      <View>
        <LinkButton title="← Back to interviews" onPress={() => setViewingId(null)} />
        <DetailCard>
          <Text style={{ fontSize: 18, fontWeight: "700", color: c.text }}>{viewing.title}</Text>
          <Text style={{ color: c.textDim, fontSize: 13, marginTop: 4, marginBottom: 12 }}>
            {viewing.date} · {formatDuration(viewing.durationSec)}
          </Text>

          <InterviewAudioPlayer recordingId={viewing.recordingId} />

          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder="Search this transcript..."
            style={{ marginTop: 14, marginBottom: 4 }}
          />

          {lines.length === 0 ? (
            <HintBox>{viewing.transcript.length === 0 ? "No transcript lines yet." : "No lines match your search."}</HintBox>
          ) : (
            <View style={[styles.transcriptFeed, { borderColor: c.border, backgroundColor: c.bg }]}>
              {lines.map((seg) => (
                <View key={seg.id} style={[styles.transcriptLine, { borderBottomColor: c.border }]}>
                  <Text style={{ color: c.textDim, fontSize: 12 }}>{formatDuration(seg.time)}</Text>
                  <Text style={{ fontWeight: "600", color: c.text, marginLeft: 6 }}>{seg.speaker}:</Text>
                  <Text style={{ color: c.text, flexShrink: 1, marginLeft: 6 }}>{seg.text}</Text>
                  <LinkButton title="Save as quote" onPress={() => saveAsQuote(viewing, seg)} style={{ marginLeft: "auto" }} />
                </View>
              ))}
            </View>
          )}

          <SecondaryButton title="+ Add transcript line" onPress={openLineModal} style={{ marginTop: 12, alignSelf: "flex-start" }} />
          <View style={{ flexDirection: "row", marginTop: 16 }}>
            <SecondaryButton title="Delete Interview" onPress={() => deleteInterview(viewing.id)} />
          </View>
        </DetailCard>

        <ModalBox visible={lineModalVisible} onClose={() => setLineModalVisible(false)} title="Add Transcript Line">
          <TextField label="Speaker" value={lineSpeaker} onChangeText={setLineSpeaker} placeholder="Jane Alvarez" />
          <TextField label="What did they say?" value={lineText} onChangeText={setLineText} multiline />
          <ModalActions>
            <SecondaryButton title="Cancel" onPress={() => setLineModalVisible(false)} />
            <PrimaryButton title="Add Line" onPress={saveLine} />
          </ModalActions>
        </ModalBox>
      </View>
    );
  }

  return (
    <View>
      <SectionHeader
        label={`${story.interviews.length} interview${story.interviews.length === 1 ? "" : "s"}`}
        action={<PrimaryButton title="+ New Interview" onPress={startInterviewSetup} />}
      />
      {story.interviews.length === 0 ? (
        <EmptyState>No interviews recorded yet.</EmptyState>
      ) : (
        story.interviews.map((i) => (
          <ListRow
            key={i.id}
            title={i.title}
            subtitle={`${i.date || ""} · ${formatDuration(i.durationSec || 0)}`}
            meta={`${i.transcript.length} transcript line${i.transcript.length === 1 ? "" : "s"}`}
            onPress={() => setViewingId(i.id)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  recStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e0392b",
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transcriptFeed: {
    maxHeight: 320,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  transcriptLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
});
