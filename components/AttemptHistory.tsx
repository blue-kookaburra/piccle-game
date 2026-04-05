"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const DOT_COLOR: Record<FeedbackColor, string> = {
  green:  "#22ff88",
  yellow: "#ffb800",
  red:    "#ff4d5a",
};

function rowAccent(attempt: Attempt): string {
  const vals = [attempt.feedback.shutter, attempt.feedback.aperture, attempt.feedback.focal];
  if (vals.includes("red"))    return "#ff4d5a";
  if (vals.includes("yellow")) return "#ffb800";
  return "#22ff88";
}

// One attempt represented as 3 coloured dots (or empty rings)
function AttemptBox({ attempt, index }: { attempt: Attempt | null; index: number }) {
  const colors = attempt
    ? ([attempt.feedback.shutter, attempt.feedback.aperture, attempt.feedback.focal] as FeedbackColor[])
    : null;

  return (
    <div className={`attempt-box${attempt ? " attempt-box--filled" : ""}`} aria-label={`Shot ${index + 1}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`attempt-box-dot${colors ? " attempt-box-dot--filled" : ""}`}
          style={colors ? { background: DOT_COLOR[colors[i]], boxShadow: `0 0 5px ${DOT_COLOR[colors[i]]}70` } : {}}
        />
      ))}
    </div>
  );
}

export default function AttemptHistory({ attempts, maxAttempts = 5 }: AttemptHistoryProps) {
  const [open, setOpen] = useState(false);

  const slots = Array.from({ length: maxAttempts }, (_, i) => attempts[i] ?? null);

  return (
    <div className="attempt-history-drawer">
      {/* ── Toggle bar — always visible ── */}
      <button
        className={`attempt-drawer-toggle${open ? " attempt-drawer-toggle--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Hide attempt history" : "Show attempt history"}
      >
        <span className="attempt-drawer-label">Shots</span>

        <div className="attempt-boxes">
          {slots.map((slot, i) => (
            <AttemptBox key={i} attempt={slot} index={i} />
          ))}
        </div>

        <motion.svg
          className="attempt-drawer-chevron"
          width="14" height="14" viewBox="0 0 14 14"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          aria-hidden="true"
        >
          <path d="M3 5l4 4 4-4" />
        </motion.svg>
      </button>

      {/* ── Expandable rows ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="drawer-body"
            className="attempt-drawer-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="attempt-history">
              {attempts.map((attempt, i) => (
                <motion.div
                  key={i}
                  className="attempt-row"
                  style={{
                    borderLeftColor: rowAccent(attempt),
                    background: i % 2 === 0 ? "var(--zone-1)" : "var(--zone-2)",
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
