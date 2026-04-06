"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PiccleLogo from "@/components/PiccleLogo";
import ImageViewer from "@/components/ImageViewer";
import CameraBody, { type DirectionHints } from "@/components/CameraBody";
import AttemptHistory from "@/components/AttemptHistory";
import ResultCard from "@/components/ResultCard";
import AboutModal from "@/components/AboutModal";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";
import { getGameState, saveGameState, type Attempt, type RevealedAnswer } from "@/lib/game-state";
import { getStreak, updateStreak, type StreakState } from "@/lib/streak";
import type { AttemptFeedback, FeedbackColor } from "@/lib/scoring";

interface DailyData {
  imageUrl: string;
  challengeNumber: number;
  challengeDate: string;
  camera?: string;
  iso?: number;
  photographer?: string;
  description?: string;
  credit?: string;
}

interface AnswerData {
  shutter: string;
  aperture: string;
  focal: number;
  shutterOriginal?: string;
  apertureOriginal?: string;
  focalOriginal?: number;
  description?: string;
  credit?: string;
  solveRate?: number;
  unsplashUrl?: string;
  comment?: string;
  completionLink?: string;
}

const MAX_ATTEMPTS = 5;

const DEFAULT_SHUTTER = Math.floor(SHUTTER_SPEEDS.length / 2);
const DEFAULT_APERTURE = Math.floor(APERTURES.length / 2);
const DEFAULT_FOCAL = Math.floor(FOCAL_LENGTHS.length / 2);

// Best colour seen so far for one setting across all past attempts
function bestColor(attempts: Attempt[], key: "shutter" | "aperture" | "focal"): FeedbackColor {
  const rank = (c: FeedbackColor) => c === "green" ? 2 : c === "yellow" ? 1 : 0;
  return attempts.reduce<FeedbackColor>(
    (best, a) => rank(a.feedback[key]) > rank(best) ? a.feedback[key] : best,
    "red"
  );
}

// Animate a dial index from current to target over ~800ms (slot-machine feel)
function animateDial(
  current: number,
  target: number,
  setter: (i: number) => void,
  delayMs = 0
) {
  if (current === target) return;
  const totalSteps = Math.abs(target - current);
  const intervalMs = Math.max(40, Math.round(800 / Math.max(totalSteps, 1)));
  const direction = target > current ? 1 : -1;
  let cur = current;

  setTimeout(() => {
    const id = setInterval(() => {
      cur += direction;
      setter(cur);
      if (cur === target) clearInterval(id);
    }, intervalMs);
  }, delayMs);
}

export default function Home() {
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [shutterIdx, setShutterIdx] = useState(DEFAULT_SHUTTER);
  const [apertureIdx, setApertureIdx] = useState(DEFAULT_APERTURE);
  const [focalIdx, setFocalIdx] = useState(DEFAULT_FOCAL);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<AnswerData | null>(null);
  const [streak, setStreak] = useState<StreakState>({
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: "",
  });
  const [firing, setFiring] = useState(false);
  const [pendingAttempt, setPendingAttempt] = useState<{ shutter: string; aperture: string; focal: number } | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [direction, setDirection] = useState<DirectionHints | null>(null);
  const [proMode, setProMode] = useState(false);
  const dialAnimatedRef = useRef(false);
  const historyRef = useRef<HTMLElement>(null);

  // Load pro mode preference from localStorage
  useEffect(() => {
    try {
      setProMode(localStorage.getItem("piccle_pro_mode") === "true");
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const localDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
    fetch(`/api/daily?date=${localDate}`)
      .then((r) => { if (!r.ok) throw new Error("no challenge"); return r.json(); })
      .then((data: DailyData) => setDaily(data))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    if (!daily) return;
    const saved = getGameState(daily.challengeDate);
    if (saved.attempts.length > 0) {
      setAttempts(saved.attempts);
      setScore(saved.score);
      setCompleted(saved.completed);
      if (saved.completed && saved.revealedAnswer) {
        setAnswer(saved.revealedAnswer);
      }
    }
    setStreak(getStreak());
  }, [daily]);

  // Animate dials to correct answer when game completes
  useEffect(() => {
    if (!completed || !answer || dialAnimatedRef.current) return;
    dialAnimatedRef.current = true;

    const targetShutter  = SHUTTER_SPEEDS.indexOf(answer.shutter);
    const targetAperture = APERTURES.indexOf(answer.aperture);
    const targetFocal    = FOCAL_LENGTHS.indexOf(answer.focal);

    if (targetShutter  !== -1) animateDial(shutterIdx,  targetShutter,  setShutterIdx,  100);
    if (targetAperture !== -1) animateDial(apertureIdx, targetAperture, setApertureIdx, 300);
    if (targetFocal    !== -1) animateDial(focalIdx,    targetFocal,    setFocalIdx,    500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, answer]);

  const handleFire = useCallback(async () => {
    if (!daily || firing || completed || attempts.length >= MAX_ATTEMPTS) return;

    setFiring(true);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 160);
    navigator.vibrate?.(50);
    setPendingAttempt({ shutter: SHUTTER_SPEEDS[shutterIdx], aperture: APERTURES[apertureIdx], focal: FOCAL_LENGTHS[focalIdx] });

    const attemptNumber = attempts.length + 1;
    const body = {
      date: daily.challengeDate,
      shutter: SHUTTER_SPEEDS[shutterIdx],
      aperture: APERTURES[apertureIdx],
      focal: FOCAL_LENGTHS[focalIdx],
      attemptNumber,
      previousBestColors: attempts.length > 0 ? {
        shutter:  bestColor(attempts, "shutter"),
        aperture: bestColor(attempts, "aperture"),
        focal:    bestColor(attempts, "focal"),
      } : undefined,
    };

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      const newAttempt: Attempt = {
        shutter: SHUTTER_SPEEDS[shutterIdx],
        aperture: APERTURES[apertureIdx],
        focal: FOCAL_LENGTHS[focalIdx],
        feedback: data.feedback as AttemptFeedback,
      };

      const newAttempts = [...attempts, newAttempt];
      const newScore = score + data.feedback.points;
      const isOver = data.feedback.isCorrect || newAttempts.length >= MAX_ATTEMPTS;

      setPendingAttempt(null);
      setAttempts(newAttempts);
      setScore(newScore);
      if (data.direction) setDirection(data.direction);
      // Scroll history into view so the new attempt row is always visible
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);

      let revealedAnswer: RevealedAnswer | undefined;
      if (isOver) {
        revealedAnswer = {
          shutter: data.answer?.shutter ?? SHUTTER_SPEEDS[shutterIdx],
          aperture: data.answer?.aperture ?? APERTURES[apertureIdx],
          focal: data.answer?.focal ?? FOCAL_LENGTHS[focalIdx],
          shutterOriginal: data.shutterOriginal,
          apertureOriginal: data.apertureOriginal,
          focalOriginal: data.focalOriginal,
          description: data.description ?? daily.description,
          credit: data.credit ?? daily.credit,
          solveRate: data.solveRate,
          unsplashUrl: data.unsplashUrl,
          comment: data.comment,
          completionLink: data.completionLink,
        };
        setCompleted(true);
        setAnswer(revealedAnswer);
        const newStreak = updateStreak(daily.challengeDate);
        setStreak(newStreak);
      }

      saveGameState({
        date: daily.challengeDate,
        attempts: newAttempts,
        completed: isOver,
        score: newScore,
        revealedAnswer,
      });
    } catch (err) {
      console.error("Submit failed", err);
      setPendingAttempt(null);
    } finally {
      setFiring(false);
    }
  }, [daily, firing, completed, attempts, score, shutterIdx, apertureIdx, focalIdx]);

  if (loadError) {
    return (
      <main className="error-screen">
        <p>something didn&apos;t expose correctly.</p>
        <p className="error-hint">
          Make sure your <code>.env.local</code> is set up, or check the console.
        </p>
      </main>
    );
  }

  if (!daily) {
    return (
      <main className="loading-screen">
        <div className="loading-spinner" />
        <p>developing...</p>
      </main>
    );
  }

  const shotsLeft = MAX_ATTEMPTS - attempts.length;

  function toggleProMode() {
    const next = !proMode;
    setProMode(next);
    try { localStorage.setItem("piccle_pro_mode", String(next)); } catch { /* ignore */ }
  }

  // Show a direction hint on a dial after 2 consecutive non-green attempts, unless pro mode is on
  const visibleHints: DirectionHints = (() => {
    if (proMode || !direction || attempts.length < 2) return {};
    const last2 = attempts.slice(-2);
    return {
      shutter:  last2.every(a => a.feedback.shutter  !== "green") ? (direction.shutter  ?? undefined) : undefined,
      aperture: last2.every(a => a.feedback.aperture !== "green") ? (direction.aperture ?? undefined) : undefined,
      focal:    last2.every(a => a.feedback.focal    !== "green") ? (direction.focal    ?? undefined) : undefined,
    };
  })();

  return (
    <main className="game-layout">
      <header className="game-header">
        <PiccleLogo className="game-logo" />
        <div className="header-right">
          {streak.currentStreak > 0 && (
            <span className="streak-badge">🔥 {streak.currentStreak}</span>
          )}
          <button className="info-btn" onClick={() => setShowAbout(true)} aria-label="How to play">
            HOW TO PLAY
          </button>
          <button
            className={`pro-mode-btn${proMode ? " pro-mode-btn--active" : ""}`}
            onClick={toggleProMode}
            aria-label={proMode ? "Disable pro mode" : "Enable pro mode"}
            title={proMode ? "Pro mode on — hints hidden" : "Pro mode off — hints shown"}
          >
            PRO
          </button>
          <Link href="/stats" className="stats-link" title="Your stats">
            <svg width="18" height="16" viewBox="0 0 18 16" fill="currentColor" aria-hidden="true">
              <rect x="0"  y="8" width="4" height="8" rx="1"/>
              <rect x="7"  y="4" width="4" height="12" rx="1"/>
              <rect x="14" y="0" width="4" height="16" rx="1"/>
            </svg>
          </Link>
        </div>
      </header>

      <section className="image-section">
        <ImageViewer
          imageUrl={daily.imageUrl}
          challengeNumber={daily.challengeNumber}
          credit={daily.credit}
          camera={daily.camera}
          iso={daily.iso}
          photographer={daily.photographer}
        />
      </section>

      <div className="content-card">
        {completed && answer ? (
          <section className="result-section">
            <ResultCard
              score={score}
              attempts={attempts}
              answer={answer}
              streak={streak}
              challengeNumber={daily.challengeNumber}
              challengeDate={daily.challengeDate}
              description={answer.description ?? daily.description}
              credit={answer.credit ?? daily.credit}
              shutterOriginal={answer.shutterOriginal}
              apertureOriginal={answer.apertureOriginal}
              focalOriginal={answer.focalOriginal}
              solveRate={answer.solveRate}
              unsplashUrl={answer.unsplashUrl}
              comment={answer.comment}
              completionLink={answer.completionLink}
              proMode={proMode}
            />
          </section>
        ) : (
          <>
            {/* Attempt history — top of card so it's always visible (Wordle pattern) */}
            <section className="history-section" ref={historyRef}>
              <AttemptHistory attempts={attempts} maxAttempts={MAX_ATTEMPTS} pendingAttempt={pendingAttempt} />
            </section>

            <section className="camera-section">
              <CameraBody
                shutterIdx={shutterIdx}
                apertureIdx={apertureIdx}
                focalIdx={focalIdx}
                onShutterChange={setShutterIdx}
                onApertureChange={setApertureIdx}
                onFocalChange={setFocalIdx}
                onFire={handleFire}
                disabled={completed || attempts.length >= MAX_ATTEMPTS}
                firing={firing}
                attemptsLeft={shotsLeft}
                shotKey={attempts.length}
                lastAttemptFeedback={attempts[attempts.length - 1]?.feedback}
                hints={visibleHints}
              />
            </section>
          </>
        )}
      </div>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* SHOOT flash — projector lamp sensation */}
      {showFlash && <div className="shoot-flash" aria-hidden="true" />}
    </main>
  );
}
