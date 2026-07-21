import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uuid } from "./id";
import { setFileStoreUser, remove as removeFile } from "./fileStore";
import { supabase, supabaseConfigured } from "./supabase";

const StoryContext = createContext(null);

function storageKey(uid) {
  return "notebook-data-v1-" + (uid || "local");
}

export function normalizeStory(story) {
  story.sources = story.sources || [];
  story.interviews = story.interviews || [];
  story.documents = story.documents || [];
  story.timeline = story.timeline || [];
  story.timeline.forEach((e) => {
    e.type = e.type || "event";
    e.done = e.done || false;
  });
  story.timelineStart = story.timelineStart || "";
  story.timelineDeadline = story.timelineDeadline || "";
  story.quotes = story.quotes || [];
  story.board = story.board || [];
  story.draft = story.draft && Array.isArray(story.draft.blocks) ? story.draft : { blocks: [] };
  story.draft.font = story.draft.font || "system";
  story.draft.blocks.forEach((b) => {
    b.bold = b.bold || false;
    b.italic = b.italic || false;
    b.underline = b.underline || false;
    b.indent = b.indent || false;
  });
  story.locked = story.locked || false;
  story.passwordHash = story.passwordHash || null;
  story.published = story.published || false;
  return story;
}

function sampleStories() {
  const s1 = {
    id: uuid(),
    emoji: "📰",
    title: "City Council Budget Investigation",
    sources: [
      {
        id: uuid(),
        name: "Jane Alvarez",
        org: "City Council",
        position: "Budget Director",
        contact: "jalvarez@city.gov",
        method: "Email",
        tags: ["Government"],
        notes: "Confirmed the $14 million figure on the record.",
      },
      {
        id: uuid(),
        name: "Marcus Webb",
        org: "Westside Neighborhood Assoc.",
        position: "President",
        contact: "555-0148",
        method: "Phone",
        tags: ["Community member", "Follow-up needed"],
        notes: "Wants to stay anonymous until the piece runs.",
      },
    ],
    interviews: [],
    documents: [],
    timeline: [
      { id: uuid(), type: "event", date: "2026-01-03", title: "City approves construction contract", description: "", done: false },
      { id: uuid(), type: "event", date: "2026-02-02", title: "Residents file complaints", description: "", done: false },
    ],
    quotes: [
      {
        id: uuid(),
        speaker: "Jane Alvarez",
        text: "We followed every legal procedure.",
        tags: ["Government"],
        date: "2026-06-01",
      },
    ],
    board: [],
    draft: {
      blocks: [
        {
          id: uuid(),
          text: 'Start writing here. Add a paragraph, then use "Link Evidence" to connect it to a source, document, quote, or timeline event.',
          links: [],
        },
      ],
    },
  };

  const s2 = {
    id: uuid(),
    emoji: "🌎",
    title: "Wildfire Recovery Feature",
    sources: [],
    interviews: [],
    documents: [],
    timeline: [],
    quotes: [],
    board: [],
    draft: { blocks: [] },
  };

  return [s1, s2];
}

// The `stories` table stores everything except `id` inside a jsonb `data`
// column — the row's own id is the source of truth, so it isn't duplicated.
function toDbData(story) {
  const { id, ...rest } = story;
  return rest;
}

function fromDbRow(row) {
  return normalizeStory({ id: row.id, ...row.data });
}

async function persistNewStory(uid, story) {
  const { error } = await supabase.from("stories").insert({ id: story.id, user_id: uid, data: toDbData(story) });
  if (error) console.error("Failed to save new story to Supabase:", error.message);
}

export function StoryProvider({ uid, children }) {
  const [stories, setStories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const keyRef = useRef(storageKey(uid));

  useEffect(() => {
    keyRef.current = storageKey(uid);
    setFileStoreUser(uid);
    let cancelled = false;
    setLoaded(false);

    (async () => {
      if (supabaseConfigured) {
        const { data, error } = await supabase
          .from("stories")
          .select("id, data")
          .eq("user_id", uid)
          .order("created_at", { ascending: true });
        if (cancelled) return;

        if (error) {
          console.error("Failed to load stories from Supabase:", error.message);
          setStories([]);
          setLoaded(true);
          return;
        }

        if (data.length === 0) {
          const sample = sampleStories().map(normalizeStory);
          setStories(sample);
          await Promise.all(sample.map((s) => persistNewStory(uid, s)));
        } else {
          setStories(data.map(fromDbRow));
        }
        if (!cancelled) setLoaded(true);
        return;
      }

      // Local-only fallback when Supabase isn't configured.
      const raw = await AsyncStorage.getItem(keyRef.current);
      if (cancelled) return;
      if (raw) {
        const saved = JSON.parse(raw);
        setStories((saved.stories || []).map(normalizeStory));
      } else {
        const sample = sampleStories().map(normalizeStory);
        setStories(sample);
        await AsyncStorage.setItem(keyRef.current, JSON.stringify({ stories: sample }));
      }
      if (!cancelled) setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Local-only persistence effect — when Supabase is configured, writes
  // happen per-mutation instead (see addStory/mutateStory below).
  useEffect(() => {
    if (!loaded || supabaseConfigured) return;
    AsyncStorage.setItem(keyRef.current, JSON.stringify({ stories }));
  }, [stories, loaded]);

  const addStory = useCallback(
    (data) => {
      const story = normalizeStory({ id: uuid(), ...data });
      setStories((prev) => [...prev, story]);
      if (supabaseConfigured) persistNewStory(uid, story);
      return story.id;
    },
    [uid]
  );

  // updater receives a deep-cloned, mutable draft of the story and mutates it in place.
  const mutateStory = useCallback((storyId, updater) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== storyId) return s;
        const clone = JSON.parse(JSON.stringify(s));
        updater(clone);
        if (supabaseConfigured) {
          supabase
            .from("stories")
            .update({ data: toDbData(clone), updated_at: new Date().toISOString() })
            .eq("id", storyId)
            .then(({ error }) => {
              if (error) console.error("Failed to save story to Supabase:", error.message);
            });
        }
        return clone;
      })
    );
  }, []);

  const getStory = useCallback((id) => stories.find((s) => s.id === id), [stories]);

  const deleteStory = useCallback(
    (storyId) => {
      const story = stories.find((s) => s.id === storyId);
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      if (story) {
        story.documents.forEach((d) => removeFile(d.fileId).catch(() => {}));
        story.interviews.forEach((i) => {
          if (i.recordingId) removeFile(i.recordingId).catch(() => {});
        });
      }
      if (supabaseConfigured) {
        supabase
          .from("stories")
          .delete()
          .eq("id", storyId)
          .then(({ error }) => {
            if (error) console.error("Failed to delete story from Supabase:", error.message);
          });
      }
    },
    [stories]
  );

  return (
    <StoryContext.Provider value={{ stories, loaded, addStory, mutateStory, getStory, deleteStory }}>
      {children}
    </StoryContext.Provider>
  );
}

export function useStories() {
  return useContext(StoryContext);
}
