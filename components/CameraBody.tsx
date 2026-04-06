"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";
import type { AttemptFeedback } from "@/lib/scoring";

const FEEDBACK_COLOR: Record<"green" | "yellow" | "red", string> = {
  green:  "#22ff88",
  yellow: "#ffb800",
  red:    "#ff4d5a",
};

// Per-parameter identity colors — deliberately distinct from G/Y/R feedback
const DIAL_COLOR: Record<string, string> = {
  shutter:  "#60a5fa",  // cornflower blue — sky, time, motion
  aperture: "#c084fc",  // lilac/violet — light, depth
  focal:    "#f9a8d4",  // blush pink — warmth, perspective
};

// ─── Half-dial SVG ───────────────────────────────────────────────────────────
//
// Tick count = number of selectable values for that setting.
// majorEvery:  shutter/focal = 2 (alternating),  aperture = 3 (full-stop = every 3rd)
// shotKey:     increments on every new shot → re-triggers the glow animation

interface HalfDialProps {
  index: number;
  total: number;
  uid: string;
  majorEvery: number;
  shotKey: number;
  dialColor: string;
  feedback?: "green" | "yellow" | "red";
}

function HalfDial({ index, total, uid, majorEvery, shotKey, dialColor, feedback }: HalfDialProps) {
  const R_BODY     = 56;
  const R_TICK_OUT = 51;
  const R_MINOR_IN = 46;
  const R_MAJOR_IN = 40;

  const rotDeg         = -(index / total) * 360;
  // Notch uses feedback color when known, otherwise dial's signature color
  const indicatorColor = feedback ? FEEDBACK_COLOR[feedback] : dialColor;
  const clipId         = `dial-clip-${uid}`;

  // Glowing major ticks in the dial's signature color (very subtle)
  const tickColor = dialColor + "40"; // 25% opacity hex

  const ticks = Array.from({ length: total }, (_, i) => {
    const angle   = ((i / total) * 2 * Math.PI) - Math.PI / 2;
    const isMajor = i % majorEvery === 0;
    const rIn     = isMajor ? R_MAJOR_IN : R_MINOR_IN;
    return {
      x1: Math.cos(angle) * rIn,
      y1: Math.sin(angle) * rIn,
      x2: Math.cos(angle) * R_TICK_OUT,
      y2: Math.sin(angle) * R_TICK_OUT,
      isMajor,
    };
  });

  return (
    <svg
      style={{ display: "block", overflow: "hidden", width: "100%", maxWidth: "118px" }}
      viewBox="-59 -59 118 65"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="-62" y="-62" width="124" height="60" />
        </clipPath>
        {/* Cool-biased radial gradient — glass, not leather */}
        <radialGradient id={`grad-${uid}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#1e2236" />
          <stop offset="100%" stopColor="#07090f" />
        </radialGradient>
      </defs>

      {/* Dial body */}
      <circle cx="0" cy="0" r={R_BODY} fill={`url(#grad-${uid})`} clipPath={`url(#${clipId})`} />

      {/* Rotating tick marks */}
      <g style={{ transform: `rotate(${rotDeg}deg)`, transformOrigin: "0px 0px", transition: "transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)" }}>
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? tickColor : "#1a1f32"}
            strokeWidth={t.isMajor ? 1.5 : 0.8}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Rim — subtle cool border */}
      <circle cx="0" cy="0" r={R_BODY} fill="none" stroke="#21263a" strokeWidth="2" clipPath={`url(#${clipId})`} />

      {/* Glow ring — pulses on each shot, keyed so it re-animates even for repeated colors */}
      {feedback && (
        <motion.circle
          key={`${uid}-glow-${shotKey}`}
          cx="0" cy="0" r={R_BODY}
          fill="none"
          stroke={FEEDBACK_COLOR[feedback]}
          clipPath={`url(#${clipId})`}
          initial={{ strokeWidth: 8, opacity: 0.9 }}
          animate={{ strokeWidth: 0, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      )}

      {/* Indicator notch — dial color or feedback color */}
      <line
        x1="0" y1={-(R_BODY + 1)} x2="0" y2={-(R_MAJOR_IN - 2)}
        stroke={indicatorColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Notch glow */}
      <line
        x1="0" y1={-(R_BODY + 1)} x2="0" y2={-(R_MAJOR_IN - 2)}
        stroke={indicatorColor}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.2"
      />

      {/* Center boss */}
      <circle cx="0" cy="0" r="3.5" fill="#0e1018" stroke="#21263a" strokeWidth="1" />
    </svg>
  );
}

// ─── Dial column ─────────────────────────────────────────────────────────────

interface DialPickerProps {
  label: string;
  value: string;
  index: number;
  total: number;
  uid: string;
  majorEvery: number;
  shotKey: number;
  dialColor: string;
  onDecrement: () => void;
  onIncrement: () => void;
  disabled?: boolean;
  feedback?: "green" | "yellow" | "red";
}

function DialPicker({
  label, value, index, total, uid, majorEvery, shotKey, dialColor,
  onDecrement, onIncrement, disabled, feedback,
}: DialPickerProps) {
  const dragRef = useRef<{ lastX: number; accumulated: number } | null>(null);

  function step(dir: 1 | -1) {
    const next = index + dir;
    if (next >= 0 && next < total) {
      dir === -1 ? onDecrement() : onIncrement();
      navigator.vibrate?.(8);
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    dragRef.current = { lastX: e.clientX, accumulated: 0 };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || disabled) return;
    const delta = e.clientX - dragRef.current.lastX;
    dragRef.current.accumulated += delta;
    dragRef.current.lastX = e.clientX;
    const STEP = 12; // px of horizontal drag per value step
    while (dragRef.current.accumulated >= STEP)  { step(-1); dragRef.current.accumulated -= STEP; }
    while (dragRef.current.accumulated <= -STEP) { step(1);  dragRef.current.accumulated += STEP; }
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  return (
    <div className="dial-picker">
      <span className="dial-label" style={{ color: dialColor + "cc" }}>{label}</span>

      <div className="dial-value-row">
        <button
          className="dial-arrow"
          onClick={() => step(-1)}
          disabled={disabled || index === 0}
          aria-label={`Decrease ${label}`}
          style={{ "--dial-active-color": dialColor } as React.CSSProperties}
        >‹</button>
        <motion.span
          className="dial-value"
          key={value}
          initial={{ opacity: 0.5, y: -4 }}
          animate={{ opacity: 1,   y:  0 }}
          transition={{ duration: 0.1 }}
          style={feedback ? { color: FEEDBACK_COLOR[feedback] } : undefined}
        >
          {value}
        </motion.span>
        <button
          className="dial-arrow"
          onClick={() => step(1)}
          disabled={disabled || index === total - 1}
          aria-label={`Increase ${label}`}
          style={{ "--dial-active-color": dialColor } as React.CSSProperties}
        >›</button>
      </div>

      {/* Drag zone: touch-action pan-y lets vertical page-scroll pass through */}
      <div
        className="dial-drag-zone"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "pan-y", cursor: disabled ? "default" : "ew-resize", userSelect: "none" }}
      >
        <HalfDial
          index={index}
          total={total}
          uid={uid}
          majorEvery={majorEvery}
          shotKey={shotKey}
          dialColor={dialColor}
          feedback={feedback}
        />
      </div>
    </div>
  );
}

// ─── Shot counter — mechanical rolling film counter window ───────────────────

const MAX_SHOTS = 5;

function ShotCounter({ value }: { value: number }) {
  const DIGIT_H = 36; // px — height of each number slot
  const digits = [5, 4, 3, 2, 1, 0];
  // index 0 = showing 5, index 5 = showing 0
  const idx = MAX_SHOTS - value;

  return (
    <div className="shot-counter-window" aria-label={`${value} shots remaining`}>
      <div
        className="shot-counter-strip"
        style={{ transform: `translateY(${-idx * DIGIT_H}px)` }}
      >
        {digits.map((n) => (
          <div key={n} className="shot-counter-digit">
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CameraBody ──────────────────────────────────────────────────────────────

interface CameraBodyProps {
  shutterIdx: number;
  apertureIdx: number;
  focalIdx: number;
  onShutterChange: (i: number) => void;
  onApertureChange: (i: number) => void;
  onFocalChange: (i: number) => void;
  onFire: () => void;
  disabled: boolean;
  firing: boolean;
  attemptsLeft: number;
  lastAttemptFeedback?: AttemptFeedback;
  shotKey: number;
}

export default function CameraBody({
  shutterIdx, apertureIdx, focalIdx,
  onShutterChange, onApertureChange, onFocalChange,
  onFire, disabled, firing, attemptsLeft, lastAttemptFeedback, shotKey,
}: CameraBodyProps) {
  return (
    <div className="camera-controls">
      <div className="dials-panel">
        <div className="dials-row">
          {/* Shutter speed — cyan — 1-stop increments, alternate major/minor */}
          <DialPicker
            label="SHUTTER SPEED"
            value={SHUTTER_SPEEDS[shutterIdx]}
            index={shutterIdx}
            total={SHUTTER_SPEEDS.length}
            uid="shutter"
            majorEvery={2}
            shotKey={shotKey}
            dialColor={DIAL_COLOR.shutter}
            onDecrement={() => onShutterChange(shutterIdx - 1)}
            onIncrement={() => onShutterChange(shutterIdx + 1)}
            disabled={disabled}
            feedback={lastAttemptFeedback?.shutter}
          />
          <div className="dial-divider" />
          {/* Aperture — amber — 1/3-stop increments, major every 3rd = full stop */}
          <DialPicker
            label="APERTURE"
            value={APERTURES[apertureIdx]}
            index={apertureIdx}
            total={APERTURES.length}
            uid="aperture"
            majorEvery={3}
            shotKey={shotKey}
            dialColor={DIAL_COLOR.aperture}
            onDecrement={() => onApertureChange(apertureIdx - 1)}
            onIncrement={() => onApertureChange(apertureIdx + 1)}
            disabled={disabled}
            feedback={lastAttemptFeedback?.aperture}
          />
          <div className="dial-divider" />
          {/* Focal length — coral — not even stops, alternate major/minor */}
          <DialPicker
            label="FOCAL LENGTH"
            value={`${FOCAL_LENGTHS[focalIdx]}mm`}
            index={focalIdx}
            total={FOCAL_LENGTHS.length}
            uid="focal"
            majorEvery={2}
            shotKey={shotKey}
            dialColor={DIAL_COLOR.focal}
            onDecrement={() => onFocalChange(focalIdx - 1)}
            onIncrement={() => onFocalChange(focalIdx + 1)}
            disabled={disabled}
            feedback={lastAttemptFeedback?.focal}
          />
        </div>
      </div>

      <motion.button
        className="shutter-btn"
        onClick={onFire}
        disabled={disabled || firing}
        whileTap={{ scale: 0.975 }}
      >
        {firing ? (
          <span className="shutter-btn-label">—</span>
        ) : (
          <>
            <span className="shutter-btn-label">SHOOT</span>
            <div className="shot-counter-section">
              <ShotCounter value={attemptsLeft} />
            </div>
          </>
        )}
      </motion.button>
    </div>
  );
}
