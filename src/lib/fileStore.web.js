import { supabaseConfigured } from "./supabase";
import * as supabaseFileStore from "./supabaseFileStore";

const DB_PREFIX = "notebook-files-";
let dbPromise = null;
let currentUid = "local";

function openDb() {
  if (dbPromise) return dbPromise;
  const name = DB_PREFIX + currentUid;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("blobs");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export function setFileStoreUser(uid) {
  const next = uid || "local";
  if (next !== currentUid) {
    currentUid = next;
    dbPromise = null;
  }
  supabaseFileStore.setSupabaseFileStoreUser(uid);
}

async function localPutFromUri(id, uri) {
  const res = await fetch(uri);
  const blob = await res.blob();
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function localGetUri(id) {
  const db = await openDb();
  const blob = await new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readonly");
    const req = tx.objectStore("blobs").get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

async function localRemove(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Files live in Supabase Storage once the project is configured; IndexedDB is
// only the fallback for running the app without Supabase credentials set.
export async function putFromUri(id, uri) {
  return supabaseConfigured ? supabaseFileStore.putFromUri(id, uri) : localPutFromUri(id, uri);
}

export async function getUri(id) {
  return supabaseConfigured ? supabaseFileStore.getUri(id) : localGetUri(id);
}

export async function remove(id) {
  return supabaseConfigured ? supabaseFileStore.remove(id) : localRemove(id);
}
