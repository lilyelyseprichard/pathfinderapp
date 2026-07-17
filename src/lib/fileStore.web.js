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
}

export async function putFromUri(id, uri) {
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

export async function getUri(id) {
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

export async function remove(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
