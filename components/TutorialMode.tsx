"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CameraBody from "@/components/CameraBody";
import {
  TUTORIAL_CHAPTERS,
  TUTORIAL_APERTURE_INDICES,
  TUTORIAL_SHUTTER_INDICES,
  TUTORIAL_FOCAL_INDICES,
  type TutorialChapterType,
} from "@/lib/tutorial-data";

interface TutorialModeProps {
  onFinish: () => void;
}

// Which dials are locked for each interactive chapter type
const LOCKED_DIALS: Record<string, ("shutter" | "aperture" | "focal")[]> = {
  aperture: ["shutter", "focal"],
  shutter:  ["aperture", "focal"],
  iso:      ["shutter", "focal"],
  focal:    ["shutter", "aperture"],
};

// Middle starting position (index 1 of 3) for each chapter type
const ACTIVE_INDICES: Record<string, number[]> = {
  aperture: TUTORIAL_APERTURE_INDICES,
  iso:      TUTORIAL_APERTURE_INDICES,
  shutter:  TUTORIAL_SHUTTER_INDICES,
  focal:    TUTORIAL_FOCAL_INDICES,
};

// Default (middle) positions for locked dials
const DEFAULT_SHUTTER  = TUTORIAL_SHUTTER_INDICES[1];
const DEFAULT_APERTURE = TUTORIAL_APERTURE_INDICES[1];
const DEFAULT_FOCAL    = TUTORIAL_FOCAL_INDICES[1];

export default function TutorialMode({ onFinish }: TutorialModeProps) {
  const [chapterIdx, setChapterIdx] = useState(0);
  const [dialPos, setDialPos] = useState(1); // 0 | 1 | 2 — start at middle value
  const [hasTouched, setHasTouched] = useState(false);

  const chapter = TUTORIAL_CHAPTERS[chapterIdx];
  const isInteractive = ["aperture", "shutter", "iso", "focal"].includes(chapter.type);
  const isIso = chapter.type === "iso";
  const totalChapters = TUTORIAL_CHAPTERS.length;

  function advance() {
    setChapterIdx((i) => i + 1);
    setDialPos(1);
    setHasTouched(false);
  }

  function goBack() {
    setChapterIdx((i) => i - 1);
    setDialPos(1);
    setHasTouched(false);
  }

  function skip() {
    try { localStorage.setItem("piccle_tutorial_done", "1"); } catch { /* ignore */ }
    onFinish();
  }

  // For interactive chapters: derive actual array indices from dialPos
  function getIndices() {
    const active = ACTIVE_INDICES[chapter.type] ?? TUTORIAL_APERTURE_INDICES;
    const activeIdx = active[dialPos];
    if (chapter.type === "aperture" || chapter.type === "iso") {
      return { shutterIdx: DEFAULT_SHUTTER, apertureIdx: activeIdx, focalIdx: DEFAULT_FOCAL };
    }
    if (chapter.type === "shutter") {
      return { shutterIdx: activeIdx, apertureIdx: DEFAULT_APERTURE, focalIdx: DEFAULT_FOCAL };
    }
    if (chapter.type === "focal") {
      return { shutterIdx: DEFAULT_SHUTTER, apertureIdx: DEFAULT_APERTURE, focalIdx: activeIdx };
    }
    return { shutterIdx: DEFAULT_SHUTTER, apertureIdx: DEFAULT_APERTURE, focalIdx: DEFAULT_FOCAL };
  }

  function getTutorialIndices() {
    if (chapter.type === "aperture" || chapter.type === "iso")
      return { aperture: TUTORIAL_APERTURE_INDICES };
    if (chapter.type === "shutter") return { shutter: TUTORIAL_SHUTTER_INDICES };
    if (chapter.type === "focal")   return { focal: TUTORIAL_FOCAL_INDICES };
    return {};
  }

  function handleJump(type: "shutter" | "aperture" | "focal", newIdx: number) {
    const arr = type === "shutter" ? TUTORIAL_SHUTTER_INDICES
              : type === "aperture" ? TUTORIAL_APERTURE_INDICES
              : TUTORIAL_FOCAL_INDICES;
    const pos = arr.indexOf(newIdx);
    if (pos !== -1) {
      setDialPos(pos);
      setHasTouched(true);
    }
  }

  const { shutterIdx, apertureIdx, focalIdx } = getIndices();
  const currentImage = chapter.images?.[dialPos];

  return (
    <div className="tutorial-overlay">
      {/* ── Header strip ───────────────────────────────────────────────── */}
      <div className="tutorial-header">
        <button
          className="tutorial-back-btn"
          onClick={goBack}
          disabled={chapterIdx === 0}
          aria-label="Previous chapter"
        >
          ← BACK
        </button>
        <span className="tutorial-step-counter">
          {chapterIdx + 1} / {totalChapters}
        </span>
        <button className="tutorial-skip-btn" onClick={skip}>SKIP</button>
      </div>

      {/* ── Chapter content ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={chapterIdx}
          className={`tutorial-chapter${isInteractive && chapter.images ? " tutorial-chapter--interactive" : ""}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Interactive chapter ──────────────────────────────────────── */}
          {isInteractive && chapter.images ? (
            <>
              {/* Photo column */}
              <div className="tutorial-image-col">
                <div className="tutorial-image-wrap">
                  {/* No fade — swap instantly so the dial feels responsive */}
                  <img
                    key={dialPos}
                    src={currentImage?.imageUrl}
                    alt={currentImage?.value ?? ""}
                    className="tutorial-image"
                  />

                  {/* ISO overlay */}
                  {currentImage?.iso !== undefined && (
                    <div className={`tutorial-iso-overlay${isIso ? " tutorial-iso-overlay--highlighted" : ""}`}>
                      ISO {currentImage.iso}
                    </div>
                  )}
                </div>
              </div>

              {/* Controls column */}
              <div className="tutorial-controls-col">
                {/* Spacer pushes body + dials to the bottom of the column */}
                <div className="tutorial-controls-spacer" />

                {/* Chapter prompt */}
                <p className="tutorial-body tutorial-body--interactive">{chapter.body}</p>

                {/* Dials */}
                <div className="tutorial-dials-wrap">
                  <CameraBody
                    shutterIdx={shutterIdx}
                    apertureIdx={apertureIdx}
                    focalIdx={focalIdx}
                    onShutterChange={(i) => handleJump("shutter", i)}
                    onApertureChange={(i) => handleJump("aperture", i)}
                    onFocalChange={(i) => handleJump("focal", i)}
                    onFire={() => {}}
                    disabled={false}
                    firing={false}
                    attemptsLeft={5}
                    shotKey={0}
                    lockedDials={LOCKED_DIALS[chapter.type]}
                    tutorialIndices={getTutorialIndices()}
                    hideFire
                  />
                </div>

                {/* NEXT — only appears after at least one dial interaction */}
                <div className="tutorial-footer">
                  {hasTouched && (
                    <motion.button
                      className="tutorial-next-btn"
                      onClick={advance}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {chapterIdx < totalChapters - 1 ? "NEXT →" : "FINISH"}
                    </motion.button>
                  )}
                </div>
              </div>
            </>
          ) : chapter.type === "done" ? (
            /* ── Done panel ───────────────────────────────────────────────── */
            <div className="tutorial-text-panel">
              <h2 className="tutorial-title">{chapter.title}</h2>
              <p className="tutorial-body">{chapter.body}</p>
              {chapter.footnote && (
                <div className="tutorial-footnote">{chapter.footnote}</div>
              )}
              <motion.button
                className="tutorial-next-btn tutorial-next-btn--large"
                onClick={() => {
                  try { localStorage.setItem("piccle_tutorial_done", "1"); } catch { /* ignore */ }
                  onFinish();
                }}
                whileTap={{ scale: 0.97 }}
              >
                LET&apos;S PLAY →
              </motion.button>
            </div>
          ) : (
            /* ── Text panel ───────────────────────────────────────────────── */
            <div className="tutorial-text-panel">
              <h2 className="tutorial-title">{chapter.title}</h2>
              <p className="tutorial-body">{chapter.body}</p>
              <motion.button
                className="tutorial-next-btn"
                onClick={advance}
                whileTap={{ scale: 0.97 }}
              >
                NEXT →
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
