import { Platform } from "react-native";

// Groq hosts a free, OpenAI-compatible Whisper transcription endpoint with a
// generous free-tier rate limit — no local model download and no credit card.
// Get a key at https://console.groq.com/keys and put it in .env.local (not
// .env, which is committed) as EXPO_PUBLIC_GROQ_API_KEY=...
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export const transcriptionConfigured = !!GROQ_API_KEY;

export async function transcribeAudio(uri) {
  if (!GROQ_API_KEY) {
    throw new Error("No Groq API key configured. Add EXPO_PUBLIC_GROQ_API_KEY to .env.local.");
  }

  const form = new FormData();
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    form.append("file", blob, "audio.m4a");
  } else {
    form.append("file", { uri, name: "audio.m4a", type: "audio/m4a" });
  }
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Transcription failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const segments = data.segments || [];
  if (!segments.length) {
    const text = (data.text || "").trim();
    return text ? [{ time: 0, speaker: "Speaker", text }] : [];
  }
  return segments
    .map((seg) => ({ time: seg.start || 0, speaker: "Speaker", text: (seg.text || "").trim() }))
    .filter((seg) => seg.text);
}
