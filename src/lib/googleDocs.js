import { Platform } from "react-native";
import { htmlToPlainText } from "./richText";

// Google Identity Services token client — a client-side-only OAuth flow (no
// client secret, no backend). Requires a Google Cloud OAuth client ID with
// this app's origin registered; see setup notes in .env. Web only, same as
// Google sign-in in lib/auth.js — GIS doesn't have a native-app equivalent
// here, and this app only ships to web.
const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";
export const googleDocsConfigured = Platform.OS === "web" && !!CLIENT_ID;

const SCOPE = "https://www.googleapis.com/auth/documents";

let tokenClient = null;
let cachedToken = null; // { accessToken, expiresAt }

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Google's sign-in script."));
    document.head.appendChild(script);
  });
}

async function ensureTokenClient() {
  await loadGoogleIdentityServices();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: () => {}, // replaced per-request in getAccessToken
    });
  }
  return tokenClient;
}

export function isGoogleConnected() {
  return !!cachedToken && cachedToken.expiresAt > Date.now();
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) {
    return cachedToken.accessToken;
  }
  const client = await ensureTokenClient();
  return new Promise((resolve, reject) => {
    client.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error_description || resp.error));
        return;
      }
      cachedToken = { accessToken: resp.access_token, expiresAt: Date.now() + resp.expires_in * 1000 };
      resolve(resp.access_token);
    };
    client.requestAccessToken();
  });
}

export function disconnectGoogle() {
  if (cachedToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(cachedToken.accessToken, () => {});
  }
  cachedToken = null;
}

async function docsApiFetch(url, body, accessToken) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google Docs request failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return res.json();
}

// One paragraph per draft block, in order — matches how they read in the
// Draft tab. Character-level bold/italic/underline formatting doesn't carry
// over to the exported doc (it's inserted as plain text); that's a known
// gap, not something this handles yet.
function draftToPlainText(draft) {
  return (draft?.blocks || []).map((b) => htmlToPlainText(b.html)).join("\n\n");
}

export async function exportStoryToGoogleDoc(story) {
  const accessToken = await getAccessToken();
  const title = story.title || "Untitled Story";

  const created = await docsApiFetch("https://docs.googleapis.com/v1/documents", { title }, accessToken);

  const text = draftToPlainText(story.draft);
  if (text.trim()) {
    await docsApiFetch(
      `https://docs.googleapis.com/v1/documents/${created.documentId}:batchUpdate`,
      { requests: [{ insertText: { location: { index: 1 }, text } }] },
      accessToken
    );
  }

  return { documentId: created.documentId, url: `https://docs.google.com/document/d/${created.documentId}/edit` };
}
