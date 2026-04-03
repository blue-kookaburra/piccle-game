"use client";

import { motion } from "framer-motion";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";
import type { AttemptFeedback } from "@/lib/scoring";

const FEEDBACK_COLOR: Record<"green" | "yellow" | "red", string> = {
  green:  "#27ae60",
  yellow: "#c8952a",
  red:    "#c0392b",
};

// ─── Half-dial SVG ───────────────────────────────────────────────────────────

interface HalfDialProps {
  index: number;
  total: number;
  uid: string;
  feedback?: "green" | "yellow" | "red";
}

function HalfDial({ index, total, uid, feedback }: HalfDialProps) {
  const TICKS       = 60;
  const MAJOR_EVERY = 5;
  const R_BODY      = 56;
  const R_TICK_OUT  = 51;
  const R_MINOR_IN  = 45;
  const R_MAJOR_IN  = 40;

  // One full 360° revolution across the full range
  const rotDeg = (index / total) * 360;
  const indicatorColor = feedback ? FEEDBACK_COLOR[feedback] : "#ff4800";
  const clipId = `dial-clip-${uid}`;

  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const angle   = ((i / TICKS) * 2 * Math.PI) - Math.PI / 2;
    const isMajor = i % MAJOR_EVERY === 0;
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
      width="118"
      height="66"
      viewBox="-59 -59 118 65"
      aria-hidden="true"
      style={{ display: "block", overflow: "hidden" }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="-62" y="-62" width="124" height="60" />
        </clipPath>
        {/* Radial gradient for dial depth */}
        <radialGradient id={`grad-${uid}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#2a2520" />
          <stop offset="100%" stopColor="#0e0b09" />
        </radialGradient>
      </defs>

      {/* Dial body with depth gradient */}
      <circle
        cx="0" cy="0" r={R_BODY}
        fill={`url(#grad-${uid})`}
        clipPath={`url(#${clipId})`}
      />

      {/* Tick marks — rotate with the dial */}
      <g
        style={{
          transform: `rotate(${rotDeg}deg)`,
          transformOrigin: "0px 0px",
          transition: "transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)",
        }}
      >
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1}
            x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? "#524844" : "#2e2926"}
            strokeWidth={t.isMajor ? 1.5 : 0.8}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Rim */}
      <circle
        cx="0" cy="0" r={R_BODY}
        fill="none"
        stroke="#2a2520"
        strokeWidth="2"
        clipPath={`url(#${clipId})`}
      />

      {/* Indicator notch at 12 o'clock — changes color with feedback */}
      <line
        x1="0" y1={-(R_BODY + 1)}
        x2="0" y2={-(R_MAJOR_IN - 2)}
        stroke={indicatorColor}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Center boss */}
      <circle cx="0" cy="0" r="3.5" fill="#1a1612" stroke="#2a2520" strokeWidth="1" />
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
  onDecrement: () => void;
  onIncrement: () => void;
  disabled?: boolean;
  feedback?: "green" | "yellow" | "red";
}

function DialPicker({
  label, value, index, total, uid,
  onDecrement, onIncrement, disabled, feedback,
}: DialPickerProps) {
  function step(dir: 1 | -1) {
    const next = index + dir;
    if (next >= 0 && next < total) {
      dir === -1 ? onDecrement() : onIncrement();
      navigator.vibrate?.(10);
    }
  }

  return (
    <div className="dial-picker">
      <span className="dial-label">{label}</span>

      <div className="dial-value-row">
        <button
          className="dial-arrow"
          onClick={() => step(-1)}
          disabled={disabled || index === 0}
          aria-label={`Decrease ${label}`}
        >
          ‹
        </button>
        <motion.span
          className="dial-value"
          key={value}
          initial={{ opacity: 0.5, y: -4 }}
          animate={{ opacity: 1,   y:  0 }}
          transition={{ duration: 0.1 }}
        >
          {value}
        </motion.span>
        <button
          className="dial-arrow"
          onClick={() => step(1)}
          disabled={disabled || index === total - 1}
          aria-label={`Increase ${label}`}
        >
          ›
        </button>
      </div>

      <HalfDial index={index} total={total} uid={uid} feedback={feedback} />
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
  lastAttemptFeedback?: AttemptFeedback;
}

export default function CameraBody({
  shutterIdx, apertureIdx, focalIdx,
  onShutterChange, onApertureChange, onFocalChange,
  onFire, disabled, firing, lastAttemptFeedback,
}: CameraBodyProps) {
  return (
    <div className="camera-controls">
      {/* Instrument panel */}
      <div className="dials-panel">
        <div className="dials-row">
          <DialPicker
            label="SHUTTER"
            value={SHUTTER_SPEEDS[shutterIdx]}
            index={shutterIdx}
            total={SHUTTER_SPEEDS.length}
            uid="shutter"
            onDecrement={() => onShutterChange(shutterIdx - 1)}
            onIncrement={() => onShutterChange(shutterIdx + 1)}
            disabled={disabled}
            feedback={lastAttemptFeedback?.shutter}
          />
          <div className="dial-divider" />
          <DialPicker
            label="APERTURE"
            value={APERTURES[apertureIdx]}
            index={apertureIdx}
            total={APERTURES.length}
            uid="aperture"
            onDecrement={() => onApertureChange(apertureIdx - 1)}
            onIncrement={() => onApertureChange(apertureIdx + 1)}
            disabled={disabled}
            feedback={lastAttemptFeedback?.aperture}
          />
          <div className="dial-divider" />
          <DialPicker
            label="FOCAL"
            value={`${FOCAL_LENGTHS[focalIdx]}mm`}
            index={focalIdx}
            total={FOCAL_LENGTHS.length}
            uid="focal"
            onDecrement={() => onFocalChange(focalIdx - 1)}
            onIncrement={() => onFocalChange(focalIdx + 1)}
            disabled={disabled}
            feedback={lastAttemptFeedback?.focal}
          />
        </div>
      </div>

      {/* Shoot */}
      <motion.button
        className="shutter-btn"
        onClick={onFire}
        disabled={disabled || firing}
        whileTap={{ scale: 0.975 }}
      >
        {firing ? "—" : "SHOOT"}
      </motion.button>
    </div>
  );
}
