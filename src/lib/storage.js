import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uuid } from "./id";
import { setFileStoreUser } from "./fileStore";

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
  return story;
}

function sampleStories() {
  const s1 = {
    id: uuid(),
    emoji: "📰",
    title: "City Council Budget Investigation",
    stage: "Drafting",
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
    stage: "Research",
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

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(keyRef.current, JSON.stringify({ stories }));
  }, [stories, loaded]);

  const addStory = useCallback((data) => {
    const story = normalizeStory({ id: uuid(), ...data });
    setStories((prev) => [...prev, story]);
    return story.id;
  }, []);

  // updater receives a deep-cloned, mutable draft of the story and mutates it in place.
  const mutateStory = useCallback((storyId, updater) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== storyId) return s;
        const clone = JSON.parse(JSON.stringify(s));
        updater(clone);
        return clone;
      })
    );
  }, []);

  const getStory = useCallback((id) => stories.find((s) => s.id === id), [stories]);

  return (
    <StoryContext.Provider value={{ stories, loaded, addStory, mutateStory, getStory }}>
      {children}
    </StoryContext.Provider>
  );
}

export function useStories() {
  return useContext(StoryContext);
}
