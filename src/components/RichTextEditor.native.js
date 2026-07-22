import React from "react";
import { TextField } from "./Field";
import { htmlToPlainText, escapeHtml } from "../lib/richText";

// Native has no contentEditable/execCommand equivalent, and adding a rich
// text library here would mean a different editor implementation per
// platform (and one I have no way to test, since this app only actually
// ships to web/GitHub Pages). This falls back to plain-text editing: it
// displays existing formatting as plain text and, if edited here, saves back
// as plain text — bold/italic/underline set on the web editor are only lost
// if the paragraph is *also* edited from a native build, which isn't this
// app's real usage pattern.
export default function RichTextEditor({ value, onChange, placeholder, style }) {
  return (
    <TextField
      value={htmlToPlainText(value)}
      onChangeText={(text) => onChange(escapeHtml(text))}
      multiline
      placeholder={placeholder}
      inputStyle={style}
    />
  );
}
