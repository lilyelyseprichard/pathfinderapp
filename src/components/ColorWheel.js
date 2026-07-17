import React from "react";
import { View, Text, PanResponder, Platform, StyleSheet } from "react-native";
import { useTheme } from "../theme";
import { hexToHsl, hslToHex } from "../lib/color";

const WHEEL_SIZE = 180;
const RADIUS = WHEEL_SIZE / 2;
const DOT_SIZE = 16;
const BAR_HEIGHT = 22;

// Pure-hue stops (0/60/120/180/240/300/360deg) for a standard rainbow wheel.
const HUE_GRADIENT =
  "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";

function polarToHueSat(x, y) {
  const dx = x - RADIUS;
  const dy = y - RADIUS;
  const dist = Math.min(Math.hypot(dx, dy), RADIUS);
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return { h: angle, s: (dist / RADIUS) * 100 };
}

// Web gets a real conic/radial-gradient wheel (react-native-web forwards
// arbitrary CSS through `style`, same trick as shadow() in theme.js). Native
// has no gradient primitive without adding a dependency, so it falls back to
// hue/saturation bars — same underlying math, just rendered as sliders.
export default function ColorWheel({ value, onChange }) {
  const c = useTheme();
  const { h, s, l } = hexToHsl(value || "#7c2140");

  const wheelResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (evt) => {
      const { h: newH, s: newS } = polarToHueSat(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      onChange(hslToHex(newH, newS, l));
    },
    onPanResponderMove: (evt) => {
      const { h: newH, s: newS } = polarToHueSat(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      onChange(hslToHex(newH, newS, l));
    },
  });

  function makeBarResponder(barWidth, onDrag) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => onDrag(evt.nativeEvent.locationX, barWidth),
      onPanResponderMove: (evt) => onDrag(evt.nativeEvent.locationX, barWidth),
    });
  }

  const hueResponder = makeBarResponder(WHEEL_SIZE, (x, w) => {
    const newH = (Math.min(Math.max(x, 0), w) / w) * 360;
    onChange(hslToHex(newH, s, l));
  });
  const satResponder = makeBarResponder(WHEEL_SIZE, (x, w) => {
    const newS = (Math.min(Math.max(x, 0), w) / w) * 100;
    onChange(hslToHex(h, newS, l));
  });
  const lightResponder = makeBarResponder(WHEEL_SIZE, (x, w) => {
    const newL = (Math.min(Math.max(x, 0), w) / w) * 100;
    onChange(hslToHex(h, s, newL));
  });

  const dotAngle = (h * Math.PI) / 180;
  const dotDist = (s / 100) * RADIUS;
  const dotX = RADIUS + dotDist * Math.cos(dotAngle) - DOT_SIZE / 2;
  const dotY = RADIUS + dotDist * Math.sin(dotAngle) - DOT_SIZE / 2;

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View
          {...wheelResponder.panHandlers}
          style={[
            styles.wheel,
            {
              backgroundImage: `radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0) 100%), ${HUE_GRADIENT}`,
            },
          ]}
        >
          <View style={[styles.dot, { left: dotX, top: dotY, backgroundColor: hslToHex(h, s, l) }]} />
        </View>
      ) : (
        <View style={styles.barsGroup}>
          <BarSlider label="Hue" value={h} max={360} responder={hueResponder} c={c} preview={(v) => hslToHex(v, s, l)} />
          <BarSlider label="Saturation" value={s} max={100} responder={satResponder} c={c} preview={(v) => hslToHex(h, v, l)} />
        </View>
      )}

      <BarSlider label="Lightness" value={l} max={100} responder={lightResponder} c={c} preview={(v) => hslToHex(h, s, v)} />

      <View style={styles.previewRow}>
        <View style={[styles.previewSwatch, { backgroundColor: hslToHex(h, s, l), borderColor: c.border }]} />
        <Text style={{ color: c.textDim, fontSize: 13 }}>{hslToHex(h, s, l)}</Text>
      </View>
    </View>
  );
}

function BarSlider({ label, value, max, responder, c, preview }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const thumbLeft = pct * WHEEL_SIZE - DOT_SIZE / 2;
  return (
    <View style={styles.barBlock}>
      <Text style={{ color: c.textDim, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <View
        {...responder.panHandlers}
        style={[
          styles.bar,
          { borderColor: c.border },
          Platform.OS === "web"
            ? {
                backgroundImage: `linear-gradient(to right, ${preview(0)}, ${preview(max * 0.5)}, ${preview(max)})`,
              }
            : { backgroundColor: preview(value) },
        ]}
      >
        <View style={[styles.dot, { left: thumbLeft, top: (BAR_HEIGHT - DOT_SIZE) / 2, backgroundColor: preview(value) }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: RADIUS,
  },
  barsGroup: {
    width: WHEEL_SIZE,
    marginBottom: 10,
  },
  barBlock: {
    width: WHEEL_SIZE,
    marginTop: 10,
  },
  bar: {
    width: WHEEL_SIZE,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    borderWidth: 1,
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: "#fff",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  previewSwatch: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
  },
});
