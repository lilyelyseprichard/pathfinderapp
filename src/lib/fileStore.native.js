import { File, Directory, Paths } from "expo-file-system";
import { supabaseConfigured } from "./supabase";
import * as supabaseFileStore from "./supabaseFileStore";

let currentUid = "local";

export function setFileStoreUser(uid) {
  currentUid = uid || "local";
  supabaseFileStore.setSupabaseFileStoreUser(uid);
}

function getDir() {
  const dir = new Directory(Paths.document, "notebook-files-" + currentUid);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

async function localPutFromUri(id, uri) {
  const dir = getDir();
  const dest = new File(dir, id);
  if (dest.exists) dest.delete();
  const source = new File(uri);
  source.copy(dest);
}

async function localGetUri(id) {
  const dir = getDir();
  const file = new File(dir, id);
  return file.exists ? file.uri : null;
}

async function localRemove(id) {
  const dir = getDir();
  const file = new File(dir, id);
  if (file.exists) file.delete();
}

// Files live in Supabase Storage once the project is configured; the local
// filesystem is only the fallback for running the app without credentials set.
export async function putFromUri(id, uri) {
  return supabaseConfigured ? supabaseFileStore.putFromUri(id, uri) : localPutFromUri(id, uri);
}

export async function getUri(id) {
  return supabaseConfigured ? supabaseFileStore.getUri(id) : localGetUri(id);
}

export async function remove(id) {
  return supabaseConfigured ? supabaseFileStore.remove(id) : localRemove(id);
}
