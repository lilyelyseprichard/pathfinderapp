// Character-level formatting is stored as a small, whitelisted HTML string
// per paragraph (<b>/<i>/<u>/<br> only) rather than a run-list — that's
// exactly what a contentEditable div already produces for execCommand-driven
// bold/italic/underline, so there's no separate range-tracking data
// structure to keep in sync with the DOM.
const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "BR"]);

export function escapeHtml(text) {
  return (text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Strips a contentEditable div's raw innerHTML down to the whitelist above
// via a detached DOM parse, so nothing it might insert (styles, spans,
// attributes, stray tags) ends up persisted. Web only (needs DOMParser) —
// RichTextEditor.native.js never produces non-whitelisted HTML in the first
// place, since it only ever writes escaped plain text.
export function sanitizeHtml(html) {
  if (typeof DOMParser === "undefined") return escapeHtml(html);
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.nodeValue);
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const children = Array.from(node.childNodes).map(walk).join("");
    if (node.tagName === "BR") return "<br>";
    if (ALLOWED_TAGS.has(node.tagName)) {
      const tag = node.tagName === "STRONG" ? "b" : node.tagName === "EM" ? "i" : node.tagName.toLowerCase();
      return children ? `<${tag}>${children}</${tag}>` : "";
    }
    // Browsers often wrap new lines in <div>/<p> inside contentEditable —
    // treat those as soft line breaks rather than dropping the text.
    if (node.tagName === "DIV" || node.tagName === "P") return children + "<br>";
    return children;
  }

  return Array.from(root.childNodes)
    .map(walk)
    .join("")
    .replace(/(<br>)+$/, "");
}

// Cross-platform (no DOM) plain-text extraction for word counts and export.
// Safe as a regex strip because the HTML it reads only ever came from
// sanitizeHtml or escapeHtml above, never arbitrary/untrusted markup.
export function htmlToPlainText(html) {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}
