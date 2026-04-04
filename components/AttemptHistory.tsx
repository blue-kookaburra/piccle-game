"use client";

import { motion } from "framer-motion";
import type { Attempt } from "@/lib/game-state";

interface AttemptHistoryProps {
  attempts: Attempt[];
  maxAttempts?: number;
}

type FeedbackColor = "green" | "yellow" | "red";

// New feedback colors — electric, vivid
const DOT_COLOR: Record<FeedbackColor, string> = {
  green:  "#22ff88",
  yellow: "#ffb800",
  red:    "#ff4d5a",
};

// Per-parameter channel colors (empty dot outlines)
const CHANNEL_COLOR: Record<"shutter" | "aperture" | "focal", string> = {
  shutter:  "#00d4c8",  // cyan
  aperture: "#ffb800",  // amber
  focal:    "#ff5c6a",  // coral
};

// Worst feedback in an attempt determines the left-edge bar color
function rowAccent(attempt: Attempt): string {
  const vals = [attempt.feedback.shutter, attempt.feedback.aperture, attempt.feedback.focal];
  if (vals.includes("red"))    return "#ff4d5a";
  if (vals.includes("yellow")) return "#ffb800";
  return "#22ff88";
}

// Circle dot: filled with feedback color (circle outline = channel color for emphasis)
function Dot({ color, channel }: { color: FeedbackColor; channel: "shutter" | "aperture" | "focal" }) {
  const fill = DOT_COLOR[color];
  const outline = CHANNEL_COLOR[channel];
  return (
    <span
      className="attempt-dot"
      style={{
        background: fill,
        boxShadow: `0 0 6px ${fill}80`,
        border: `1.5px solid ${outline}`,
      }}
    />
  );
}

export default function AttemptHistory({ attempts, maxAttempts = 5 }: AttemptHistoryProps) {
  return (
    <div className="attempt-history">
      {attempts.map((attempt, i) => (
        <motion.div
          key={i}
          className="attempt-row"
          style={{
            borderLeftColor: rowAccent(attempt),
            background: i % 2 === 0 ? "var(--zone-1)" : "var(--zone-2)",
          }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.04 }}
        >
          <span className="attempt-num">{i + 1}</span>

          <div className="attempt-settings">
            <span className="attempt-setting" style={{ color: CHANNEL_COLOR.shutter + "cc" }}>{attempt.shutter}</span>
            <span className="attempt-setting" style={{ color: CHANNEL_COLOR.aperture + "cc" }}>{attempt.aperture}</span>
            <span className="attempt-setting" style={{ color: CHANNEL_COLOR.focal + "cc" }}>{attempt.focal}mm</span>
          </div>

          <div className="attempt-dots">
            {(["shutter", "aperture", "focal"] as const).map((key) => (
              <Dot key={key} color={attempt.feedback[key]} channel={key} />
            ))}
          </div>

          <span className={`attempt-pts${attempt.feedback.points === 0 ? " attempt-pts--zero" : ""}`}>
            +{attempt.feedback.points}
          </span>
        </motion.div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: maxAttempts - attempts.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="attempt-row attempt-row--empty"
          style={{ background: (attempts.length + i) % 2 === 0 ? "var(--zone-1)" : "var(--zone-2)" }}
        >
          <span className="attempt-num">{attempts.length + i + 1}</span>
          <div className="attempt-settings">
            <span className="attempt-setting" style={{ color: "#21263a" }}>——</span>
            <span className="attempt-setting" style={{ color: "#21263a" }}>——</span>
            <span className="attempt-setting" style={{ color: "#21263a" }}>——</span>
          </div>
          <div className="attempt-dots">
            {(["shutter", "aperture", "focal"] as const).map((key) => (
              <span
                key={key}
                className="attempt-dot attempt-dot--empty"
                style={{ border: `1.5px solid ${CHANNEL_COLOR[key]}40` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
