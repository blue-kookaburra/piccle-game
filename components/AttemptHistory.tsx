"use client";

import { motion } from "framer-motion";
import type { Attempt } from "@/lib/game-state";

interface AttemptHistoryProps {
  attempts: Attempt[];
  maxAttempts?: number;
}

type FeedbackColor = "green" | "yellow" | "red";

const DOT_COLOR: Record<FeedbackColor, string> = {
  green:  "#27ae60",
  yellow: "#c8952a",
  red:    "#c0392b",
};

const DOT_BORDER: Record<FeedbackColor, string> = {
  green:  "#27ae60",
  yellow: "#c8952a",
  red:    "#c0392b",
};

// Worst feedback in an attempt determines the row accent color
function rowAccent(attempt: Attempt): string {
  const vals = [attempt.feedback.shutter, attempt.feedback.aperture, attempt.feedback.focal];
  if (vals.includes("red"))    return "#c0392b";
  if (vals.includes("yellow")) return "#c8952a";
  return "#27ae60";
}

// Dots: filled square for green/yellow, open circle for wrong (BRAND.md spec)
function Dot({ color }: { color: FeedbackColor }) {
  return (
    <span
      className="attempt-dot"
      style={{ background: DOT_COLOR[color], borderColor: DOT_BORDER[color] }}
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
          style={{ borderLeftColor: rowAccent(attempt) }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.04 }}
        >
          <span className="attempt-num">{i + 1}</span>

          <div className="attempt-settings">
            <span className="attempt-setting">{attempt.shutter}</span>
            <span className="attempt-setting">{attempt.aperture}</span>
            <span className="attempt-setting">{attempt.focal}mm</span>
          </div>

          <div className="attempt-dots">
            {(["shutter", "aperture", "focal"] as const).map((key) => (
              <Dot key={key} color={attempt.feedback[key]} />
            ))}
          </div>

          <span className="attempt-pts">+{attempt.feedback.points}</span>
        </motion.div>
      ))}

      {/* Empty slots — em dashes per BRAND.md */}
      {Array.from({ length: maxAttempts - attempts.length }).map((_, i) => (
        <div key={`empty-${i}`} className="attempt-row attempt-row--empty">
          <span className="attempt-num">{attempts.length + i + 1}</span>
          <div className="attempt-settings">
            <span className="attempt-setting" style={{ color: "#2a2520" }}>——</span>
            <span className="attempt-setting" style={{ color: "#2a2520" }}>——</span>
            <span className="attempt-setting" style={{ color: "#2a2520" }}>——</span>
          </div>
          <div className="attempt-dots">
            {[0, 1, 2].map((j) => (
              <span key={j} className="attempt-dot attempt-dot--empty"
                style={{ borderColor: "#2a2520" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
