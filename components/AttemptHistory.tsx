"use client";

import { motion } from "framer-motion";
import type { Attempt } from "@/lib/game-state";

interface AttemptHistoryProps {
  attempts: Attempt[];
  maxAttempts?: number;
}

type FeedbackColor = "green" | "yellow" | "red";

const TEXT_COLOR: Record<FeedbackColor, string> = {
  green:  "#22ff88",
  yellow: "#ffb800",
  red:    "#ff4d5a",
};

// Worst feedback in an attempt determines the left-edge bar color
function rowAccent(attempt: Attempt): string {
  const vals = [attempt.feedback.shutter, attempt.feedback.aperture, attempt.feedback.focal];
  if (vals.includes("red"))    return "#ff4d5a";
  if (vals.includes("yellow")) return "#ffb800";
  return "#22ff88";
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
            <span className="attempt-setting" style={{ color: TEXT_COLOR[attempt.feedback.shutter] }}>{attempt.shutter}</span>
            <span className="attempt-setting" style={{ color: TEXT_COLOR[attempt.feedback.aperture] }}>{attempt.aperture}</span>
            <span className="attempt-setting" style={{ color: TEXT_COLOR[attempt.feedback.focal] }}>{attempt.focal}mm</span>
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
            <span className="attempt-setting" style={{ color: "var(--zone-3)" }}>——</span>
            <span className="attempt-setting" style={{ color: "var(--zone-3)" }}>——</span>
            <span className="attempt-setting" style={{ color: "var(--zone-3)" }}>——</span>
          </div>
        </div>
      ))}
    </div>
  );
}
