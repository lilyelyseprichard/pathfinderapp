import React, { useRef, useState, useLayoutEffect } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme";
import { sanitizeHtml } from "../lib/richText";

function ToolbarButton({ label, active, weight, italic, underline, onPress, c }) {
  return (
    <Pressable
      // mousedown (not just press/click) fires before the browser moves
      // focus/selection out of the contentEditable div — preventing its
      // default here is what keeps the user's text selection alive so
      // execCommand has something to act on.
      onMouseDown={(e) => e.preventDefault()}
      onPress={onPress}
      style={[styles.btn, { borderColor: active ? c.accent : c.border, backgroundColor: active ? c.accentSoft : "transparent" }]}
    >
      <Text
        style={{
          color: active ? c.accent : c.textDim,
          fontSize: 13,
          fontWeight: weight || "600",
          fontStyle: italic ? "italic" : "normal",
          textDecorationLine: underline ? "underline" : "none",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Character-level bold/italic/underline via a real contentEditable div and
// document.execCommand — plain RN TextInput has no way to render mixed
// formatting within a single value, so there's no way to do this with the
// components used elsewhere in the app. execCommand is deprecated but still
// broadly supported for these basic commands, and is by far the simplest way
// to get selection-aware toggling (partial selections, "bold from the
// cursor on", etc.) without hand-rolling DOM Range/Selection math.
export default function RichTextEditor({ value, onChange, placeholder, style }) {
  const c = useTheme();
  const divRef = useRef(null);
  // Starts as undefined (never equal to a real string value) so the effect
  // below always populates the div's initial content on first mount too.
  const lastValueRef = useRef();
  const [active, setActive] = useState({ bold: false, italic: false, underline: false });

  // Only touches the DOM when `value` changed for a reason OTHER than this
  // component's own handleInput (which already updated lastValueRef first) —
  // e.g. switching stories, or an external update to this paragraph. Without
  // that check, every keystroke would reset innerHTML and jump the cursor
  // back to the start.
  useLayoutEffect(() => {
    const node = divRef.current;
    if (node && value !== lastValueRef.current && node.innerHTML !== (value || "")) {
      node.innerHTML = value || "";
    }
    lastValueRef.current = value;
  }, [value]);

  function refreshActive() {
    if (typeof document === "undefined") return;
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  }

  function handleInput() {
    if (!divRef.current) return;
    const clean = sanitizeHtml(divRef.current.innerHTML);
    lastValueRef.current = clean;
    onChange(clean);
    refreshActive();
  }

  function exec(command) {
    divRef.current?.focus();
    document.execCommand(command);
    handleInput();
  }

  const isEmpty = !value || value === "<br>" || htmlIsBlank(value);

  return (
    <View>
      <View style={styles.toolbar}>
        <ToolbarButton label="B" weight="700" active={active.bold} onPress={() => exec("bold")} c={c} />
        <ToolbarButton label="I" italic active={active.italic} onPress={() => exec("italic")} c={c} />
        <ToolbarButton label="U" underline active={active.underline} onPress={() => exec("underline")} c={c} />
      </View>
      <View style={styles.editorWrap}>
        {isEmpty ? (
          <Text pointerEvents="none" style={[styles.placeholder, { color: c.textDim }, style]}>
            {placeholder}
          </Text>
        ) : null}
        {React.createElement("div", {
          ref: divRef,
          contentEditable: true,
          suppressContentEditableWarning: true,
          onInput: handleInput,
          onBlur: handleInput,
          onKeyUp: refreshActive,
          onMouseUp: refreshActive,
          onFocus: refreshActive,
          style: {
            minHeight: 60,
            outline: "none",
            fontSize: 14,
            lineHeight: "20px",
            color: c.text,
            ...style,
          },
        })}
      </View>
    </View>
  );
}

function htmlIsBlank(html) {
  return html.replace(/<br\s*\/?>/gi, "").trim() === "";
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  btn: {
    minWidth: 30,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
  },
  editorWrap: {
    position: "relative",
  },
  placeholder: {
    position: "absolute",
    top: 0,
    left: 0,
    fontSize: 14,
  },
});
