import { File, Directory, Paths } from "expo-file-system";

let currentUid = "local";

export function setFileStoreUser(uid) {
  currentUid = uid || "local";
}

function getDir() {
  const dir = new Directory(Paths.document, "notebook-files-" + currentUid);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export async function putFromUri(id, uri) {
  const dir = getDir();
  const dest = new File(dir, id);
  if (dest.exists) dest.delete();
  const source = new File(uri);
  source.copy(dest);
}

export async function getUri(id) {
  const dir = getDir();
  const file = new File(dir, id);
  return file.exists ? file.uri : null;
}

export async function remove(id) {
  const dir = getDir();
  const file = new File(dir, id);
  if (file.exists) file.delete();
}
