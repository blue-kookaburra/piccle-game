"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Attempt } from "@/lib/game-state";
import type { StreakState } from "@/lib/streak";
import { getSkillTier } from "@/lib/skill-tier";
import { explainSettings } from "@/lib/explain-settings";
import { generateShareCard } from "@/lib/share-card";

interface ResultCardProps {
  score: number;
  attempts: Attempt[];
  answer: { shutter: string; aperture: string; focal: number };
  streak: StreakState;
  challengeNumber: number;
  shutterOriginal?: string;
  apertureOriginal?: string;
  focalOriginal?: number;
  description?: string;
  credit?: string;
  solveRate?: number;
}

export default function ResultCard({
  score,
  attempts,
  answer,
  streak,
  challengeNumber,
  shutterOriginal,
  apertureOriginal,
  focalOriginal,
  description,
  credit,
  solveRate,
}: ResultCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const animatedRef = useRef(false);

  // Count up score on mount
  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    const duration = 800;
    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [score]);

  const tier = getSkillTier(score);
  const explanation = explainSettings(answer.shutter, answer.aperture, answer.focal, description);

  function buildShareText(): string {
    const DOT = { green: "🟢", yellow: "🟡", red: "🔴" } as const;
    const rows = attempts
      .map((a) => `${DOT[a.feedback.shutter]}${DOT[a.feedback.aperture]}${DOT[a.feedback.focal]}`)
      .join("\n");

    const streakLine = streak.currentStreak > 1
      ? `🔥 ${streak.currentStreak} frames straight`
      : "";

    return [
      `📸 PICCLE — Frame ${challengeNumber}`,
      rows,
      `${score}/1000  ${tier.tier}`,
      streakLine,
      "piccle.app",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function handleShareText() {
    const text = buildShareText();
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Result copied to clipboard!");
    }
  }

  async function handleDownloadImage() {
    setDownloading(true);
    try {
      const blob = await generateShareCard({
        attempts,
        score,
        challengeNumber,
        streak: streak.currentStreak,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `piccle-frame-${challengeNumber}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Share card failed", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <motion.div
      className="result-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      {/* Score */}
      <div className="result-score">{displayScore}</div>
      <div className="result-score-label">out of 1000</div>

      {/* Skill tier badge */}
      <span className={`skill-tier-badge${tier.isMaster ? " skill-tier-badge--master" : ""}`}>
        {tier.tier}
      </span>

      {/* Streak */}
      {streak.currentStreak >= 2 ? (
        <div className="result-streak">
          🔥 {streak.currentStreak} frames straight
          {streak.longestStreak > streak.currentStreak && (
            <span className="result-streak-longest">
              · longest: {streak.longestStreak}
            </span>
          )}
        </div>
      ) : streak.currentStreak === 0 ? (
        <div className="result-streak-reset">streak reset</div>
      ) : null}

      {/* Today's settings */}
      <div className="result-answer">
        <div className="result-answer-title">Today&apos;s settings</div>
        <div className="result-answer-values">
          <div className="result-answer-item">
            <span className="rai-label">Shutter</span>
            <span className="rai-value" style={{ fontFamily: "var(--font-mono)" }}>{answer.shutter}</span>
            {shutterOriginal && shutterOriginal !== answer.shutter && (
              <span className="rai-original">EXIF: {shutterOriginal}</span>
            )}
          </div>
          <div className="result-answer-item">
            <span className="rai-label">Aperture</span>
            <span className="rai-value" style={{ fontFamily: "var(--font-mono)" }}>{answer.aperture}</span>
            {apertureOriginal && apertureOriginal !== answer.aperture && (
              <span className="rai-original">EXIF: {apertureOriginal}</span>
            )}
          </div>
          <div className="result-answer-item">
            <span className="rai-label">Focal</span>
            <span className="rai-value" style={{ fontFamily: "var(--font-mono)" }}>{answer.focal}mm</span>
            {focalOriginal !== undefined && focalOriginal !== answer.focal && (
              <span className="rai-original">EXIF: {focalOriginal}mm</span>
            )}
          </div>
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <p className="result-explanation">{explanation}</p>
      )}

      {/* Photographer credit */}
      {credit && (
        <p className="result-credit">Photo by {credit}</p>
      )}

      {/* Solve rate */}
      {solveRate !== undefined && (
        <p className={`solve-rate${solveRate < 30 ? " solve-rate--rare" : ""}`}>
          {solveRate < 30
            ? `Only ${solveRate}% of players solved today`
            : `${solveRate}% of players solved today`}
        </p>
      )}

      {/* Share buttons */}
      <div className="share-buttons">
        <motion.button
          className="share-btn"
          onClick={handleShareText}
          whileTap={{ scale: 0.97 }}
        >
          Show your work
        </motion.button>
        <motion.button
          className="share-btn share-btn--secondary"
          onClick={handleDownloadImage}
          disabled={downloading}
          whileTap={{ scale: 0.97 }}
        >
          {downloading ? "saving..." : "Save image"}
        </motion.button>
      </div>
    </motion.div>
  );
}
