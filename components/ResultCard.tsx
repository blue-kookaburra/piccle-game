"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Attempt } from "@/lib/game-state";
import type { StreakState } from "@/lib/streak";
import AttemptHistory from "@/components/AttemptHistory";
import { getSkillTier } from "@/lib/skill-tier";
import { explainSettings } from "@/lib/explain-settings";
import { generateShareCard } from "@/lib/share-card";
import { formatDate } from "@/lib/date-utils";
import { track } from "@/lib/analytics";

interface ResultCardProps {
  score: number;
  attempts: Attempt[];
  answer: { shutter: string; aperture: string; focal: number };
  streak: StreakState;
  challengeNumber: number;
  challengeDate: string;
  shutterOriginal?: string;
  apertureOriginal?: string;
  focalOriginal?: number;
  description?: string;
  credit?: string;
  solveRate?: number;
  unsplashUrl?: string;
  comment?: string;
  completionLink?: string;
  proMode?: boolean;
}

export default function ResultCard({
  score, attempts, answer, streak, challengeNumber, challengeDate,
  shutterOriginal, apertureOriginal, focalOriginal,
  description, credit, solveRate, unsplashUrl, comment, completionLink,
  proMode,
}: ResultCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [flashed, setFlashed]           = useState(false);
  const [downloading, setDownloading]   = useState(false);
  const animatedRef = useRef(false);

  // Score count-up with ease-out cubic, then flash at the end
  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    const duration = 900;
    const start = performance.now();

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Brief flash when count lands
        setTimeout(() => setFlashed(true), 60);
        setTimeout(() => setFlashed(false), 400);
      }
    }
    requestAnimationFrame(step);
  }, [score]);

  const tier = getSkillTier(score);
  const explanation = comment || explainSettings(answer.shutter, answer.aperture, answer.focal, description);

  function buildShareText(): string {
    const DOT = { green: "🟢", yellow: "🟡", red: "🔴" } as const;
    const rows = attempts
      .map((a) => `${DOT[a.feedback.shutter]}${DOT[a.feedback.aperture]}${DOT[a.feedback.focal]}`)
      .join("\n");
    const streakLine = streak.currentStreak > 1 ? `🔥 ${streak.currentStreak} frames straight` : "";
    const proLine = proMode ? "⚡ PRO MODE" : "";
    return [`📸 PICCLE — Frame ${formatDate(challengeDate)}`, rows, `${score}/1000  ${tier.tier}`, streakLine, proLine, "piccle.io"]
      .filter(Boolean).join("\n");
  }

  async function handleShareText() {
    const text = buildShareText();
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    track("share_text_copied", { score, challengeNumber });
  }

  async function handleDownloadImage() {
    setDownloading(true);
    try {
      const blob = await generateShareCard({ attempts, score, challengeNumber, challengeDate, streak: streak.currentStreak });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `piccle-frame-${formatDate(challengeDate)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      track("share_card_saved", { score, challengeNumber });
    } catch (err) {
      console.error("Share card failed", err);
    } finally {
      setDownloading(false);
    }
  }

  const won = attempts[attempts.length - 1]?.feedback.isCorrect ?? false;
  const shotCount = attempts.length;

  return (
    <motion.div
      className="result-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Completion message ── */}
      <div className={`result-outcome${won ? " result-outcome--won" : " result-outcome--lost"}`}>
        {won ? `Correct in ${shotCount} shot${shotCount === 1 ? "" : "s"}!` : "Better luck next time"}
      </div>

      {/* ── Attempt history ── */}
      <AttemptHistory attempts={attempts} maxAttempts={5} />

      {/* ── Score ── */}
      <div className="result-score-block">
        <motion.div
          className="result-score"
          animate={flashed ? { color: "#ffffff" } : { color: "var(--hot-pixel)" }}
          transition={{ duration: 0.15 }}
        >
          {displayScore}
        </motion.div>
        <div className="result-score-label">out of 1000</div>
        {/* Tier scale — all five tiers, current one highlighted */}
        <div className="tier-scale">
          {(["Tourist", "Enthusiast", "Keen Amateur", "Artisan", "Master"] as const).map((t) => (
            <div key={t} className={`tier-scale-item${tier.tier === t ? " tier-scale-item--active" : ""}`}>
              <span className="tier-scale-name">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Streak ── */}
      {streak.currentStreak >= 2 ? (
        <div className="result-streak-row">
          <span style={{ fontSize: 18 }}>🔥</span>
          <span className="result-streak">{streak.currentStreak} frames straight</span>
          {streak.longestStreak > streak.currentStreak && (
            <span className="result-streak-longest">· longest: {streak.longestStreak}</span>
          )}
        </div>
      ) : streak.currentStreak === 0 ? (
        <div className="result-streak-reset">streak reset</div>
      ) : null}

      {/* ── Settings reveal ── */}
      <motion.div
        className="result-settings-block"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1,  y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <div className="result-settings-label">Today&apos;s settings</div>
        <div className="result-settings-values">
          <div className="result-setting-item">
            <span className="rsi-value">{answer.shutter}</span>
            <span className="rsi-label">Shutter Speed</span>
            {shutterOriginal && shutterOriginal !== answer.shutter && (
              <span className="rsi-original">EXIF {shutterOriginal}</span>
            )}
          </div>
          <div className="result-setting-item">
            <span className="rsi-value">{answer.aperture}</span>
            <span className="rsi-label">Aperture</span>
            {apertureOriginal && apertureOriginal !== answer.aperture && (
              <span className="rsi-original">EXIF {apertureOriginal}</span>
            )}
          </div>
          <div className="result-setting-item">
            <span className="rsi-value">{answer.focal}mm</span>
            <span className="rsi-label">Focal Length</span>
            {focalOriginal !== undefined && focalOriginal !== answer.focal && (
              <span className="rsi-original">EXIF {focalOriginal}mm</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Explanation ── */}
      {explanation && (
        <motion.div
          className="result-explanation-block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <p className="result-explanation">{explanation}</p>
        </motion.div>
      )}

      {/* ── Credit + solve rate + view link ── */}
      {(credit || solveRate !== undefined || completionLink) && (
        <div className="result-meta-block">
          {credit && (
            <span className="result-credit">
              Photo by{" "}
              {unsplashUrl ? (
                <a href={unsplashUrl} target="_blank" rel="noopener noreferrer" className="result-credit-link">
                  {credit}
                </a>
              ) : credit}
            </span>
          )}
          {completionLink && (
            <a href={completionLink} target="_blank" rel="noopener noreferrer" className="result-view-link">
              View photo ↗
            </a>
          )}
          {solveRate !== undefined && (
            <span className={`solve-rate${solveRate < 30 ? " solve-rate--rare" : ""}`}>
              {solveRate < 30 ? `only ${solveRate}% of players solved today` : `${solveRate}% of players solved today`}
            </span>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="result-actions">
        <motion.button
          className="share-btn"
          onClick={handleShareText}
          whileTap={{ scale: 0.97 }}
        >
          SHARE
        </motion.button>
        <motion.button
          className="share-btn share-btn--secondary"
          onClick={handleDownloadImage}
          disabled={downloading}
          whileTap={{ scale: 0.97 }}
        >
          {downloading ? "saving..." : "SAVE"}
        </motion.button>
      </div>
    </motion.div>
  );
}
