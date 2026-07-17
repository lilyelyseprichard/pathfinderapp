import { supabase } from "./supabase";

const BUCKET = "story-files";
let currentUid = "local";

export function setSupabaseFileStoreUser(uid) {
  currentUid = uid || "local";
}

function objectPath(id) {
  return `${currentUid}/${id}`;
}

export async function putFromUri(id, uri) {
  const res = await fetch(uri);
  const blob = await res.blob();
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath(id), blob, {
    upsert: true,
    contentType: blob.type || undefined,
  });
  if (error) throw error;
}

export async function getUri(id) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(objectPath(id), 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function remove(id) {
  await supabase.storage.from(BUCKET).remove([objectPath(id)]);
}
