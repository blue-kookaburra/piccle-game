"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PiccleLogo from "@/components/PiccleLogo";
import ImageViewer from "@/components/ImageViewer";
import CameraBody from "@/components/CameraBody";
import AttemptHistory from "@/components/AttemptHistory";
import ResultCard from "@/components/ResultCard";
import AboutModal from "@/components/AboutModal";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";
import { getGameState, saveGameState, type Attempt } from "@/lib/game-state";
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
  const [showAbout, setShowAbout] = useState(false);
  const dialAnimatedRef = useRef(false);

  useEffect(() => {
    fetch("/api/daily")
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
    navigator.vibrate?.(50);

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

      setAttempts(newAttempts);
      setScore(newScore);

      if (isOver) {
        setCompleted(true);
        setAnswer({
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
        });
        const newStreak = updateStreak(daily.challengeDate);
        setStreak(newStreak);
      }

      saveGameState({
        date: daily.challengeDate,
        attempts: newAttempts,
        completed: isOver,
        score: newScore,
      });
    } catch (err) {
      console.error("Submit failed", err);
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

  return (
    <main className="game-layout">
      <header className="game-header">
        <PiccleLogo className="game-logo" />
        <div className="header-right">
          {streak.currentStreak > 0 && (
            <span className="streak-badge">🔥 {streak.currentStreak}</span>
          )}
          <button className="info-btn" onClick={() => setShowAbout(true)} aria-label="About Piccle">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5"/>
              <line x1="8" y1="7.5" x2="8" y2="11.5" strokeLinecap="round"/>
              <circle cx="8" cy="4.75" r="0.85" fill="currentColor" stroke="none"/>
            </svg>
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
              description={answer.description ?? daily.description}
              credit={answer.credit ?? daily.credit}
              shutterOriginal={answer.shutterOriginal}
              apertureOriginal={answer.apertureOriginal}
              focalOriginal={answer.focalOriginal}
              solveRate={answer.solveRate}
              unsplashUrl={answer.unsplashUrl}
            />
          </section>
        ) : (
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
            />
          </section>
        )}

        <section className="history-section">
          <AttemptHistory attempts={attempts} maxAttempts={MAX_ATTEMPTS} />
        </section>
      </div>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </main>
  );
}
