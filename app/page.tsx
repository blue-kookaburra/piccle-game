"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import ImageViewer from "@/components/ImageViewer";
import CameraBody from "@/components/CameraBody";
import AttemptHistory from "@/components/AttemptHistory";
import ResultCard from "@/components/ResultCard";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";
import { getGameState, saveGameState, type Attempt } from "@/lib/game-state";
import { getStreak, updateStreak, type StreakState } from "@/lib/streak";
import type { AttemptFeedback } from "@/lib/scoring";

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
}

const MAX_ATTEMPTS = 5;

const DEFAULT_SHUTTER = Math.floor(SHUTTER_SPEEDS.length / 2);
const DEFAULT_APERTURE = Math.floor(APERTURES.length / 2);
const DEFAULT_FOCAL = Math.floor(FOCAL_LENGTHS.length / 2);

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
        <h1 className="game-title">PICCLE</h1>
        <div className="header-right">
          {streak.currentStreak > 0 && (
            <span className="streak-badge">🔥 {streak.currentStreak}</span>
          )}
          <Link href="/stats" className="stats-link" title="Your stats">
            ◎
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
        <section className="history-section">
          <AttemptHistory attempts={attempts} maxAttempts={MAX_ATTEMPTS} />
        </section>

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
              lastAttemptFeedback={attempts[attempts.length - 1]?.feedback}
            />
            <p className="attempts-remaining">
              {shotsLeft} {shotsLeft === 1 ? "shot" : "shots"} left
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
