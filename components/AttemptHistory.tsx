"use client";

import { motion } from "framer-motion";
import type { Attempt } from "@/lib/game-state";

interface AttemptHistoryProps {
  attempts: Attempt[];
  maxAttempts?: number;
}

const COLOR_MAP = {
  green:  { bg: "#27ae60", label: "●" },
  yellow: { bg: "#c8952a", label: "●" },
  red:    { bg: "#c0392b", label: "●" },
};

export default function AttemptHistory({ attempts, maxAttempts = 5 }: AttemptHistoryProps) {
  return (
    <div className="attempt-history">
      {attempts.map((attempt, i) => (
        <motion.div
          key={i}
          className="attempt-row"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <span className="attempt-num">{i + 1}</span>

          <div className="attempt-settings">
            <span className="attempt-setting">{attempt.shutter}</span>
            <span className="attempt-setting">{attempt.aperture}</span>
            <span className="attempt-setting">{attempt.focal}mm</span>
          </div>

          <div className="attempt-dots">
            {(["shutter", "aperture", "focal"] as const).map((key) => {
              const c = attempt.feedback[key];
              return (
                <span
                  key={key}
                  className="attempt-dot"
                  style={{ color: COLOR_MAP[c].bg }}
                  title={`${key}: ${c}`}
                >
                  {COLOR_MAP[c].label}
                </span>
              );
            })}
          </div>

          <span className="attempt-pts">+{attempt.feedback.points}</span>
        </motion.div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: maxAttempts - attempts.length }).map((_, i) => (
        <div key={`empty-${i}`} className="attempt-row attempt-row--empty">
          <span className="attempt-num">{attempts.length + i + 1}</span>
          <div className="attempt-dots">
            <span className="attempt-dot" style={{ color: "#333" }}>●</span>
            <span className="attempt-dot" style={{ color: "#333" }}>●</span>
            <span className="attempt-dot" style={{ color: "#333" }}>●</span>
          </div>
        </div>
      ))}
    </div>
  );
}
