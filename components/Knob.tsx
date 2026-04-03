"use client";

import { useRef, useCallback } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface KnobProps {
  label: string;
  values: (string | number)[];
  currentIndex: number;
  onChange: (i: number) => void;
  disabled?: boolean;
  accentColor: string;
  unit?: string;
}

// Knob sweeps 270° — min at 7 o'clock (-135°), max at 5 o'clock (+135°)
const SWEEP = 270;
const MIN_DEG = -135;

// SVG arc constants
const R = 44;
const CX = 50;
const CY = 50;
const CIRC = 2 * Math.PI * R;
const ARC_LEN = CIRC * (SWEEP / 360); // portion of circumference = 270°

function ArcTrack({ progress, color }: { progress: number; color: string }) {
  const filled = ARC_LEN * progress;
  return (
    <svg viewBox="0 0 100 100" className="knob-arc-svg" aria-hidden>
      {/* Track (full 270° arc) */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#222"
        strokeWidth="5"
        strokeDasharray={`${ARC_LEN} ${CIRC - ARC_LEN}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(-225 ${CX} ${CY})`}
      />
      {/* Fill arc */}
      {filled > 0 && (
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${filled} ${CIRC - filled}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-225 ${CX} ${CY})`}
          style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
        />
      )}
      {/* Min/max end caps */}
      <circle cx={CX + R * Math.cos((225 * Math.PI) / 180)} cy={CY + R * Math.sin((225 * Math.PI) / 180)} r="1.5" fill="#333" />
      <circle cx={CX + R * Math.cos((315 * Math.PI) / 180)} cy={CY + R * Math.sin((315 * Math.PI) / 180)} r="1.5" fill="#333" />
    </svg>
  );
}

export default function Knob({
  label,
  values,
  currentIndex,
  onChange,
  disabled = false,
  accentColor,
  unit = "",
}: KnobProps) {
  const dragStart = useRef<{ y: number; idx: number } | null>(null);

  const progress = values.length > 1 ? currentIndex / (values.length - 1) : 0;
  const targetDeg = MIN_DEG + progress * SWEEP;

  // Spring-animated rotation
  const springDeg = useSpring(targetDeg, { stiffness: 300, damping: 28 });
  const rotate = useTransform(springDeg, (v) => `rotate(${v}deg)`);

  // Keep spring in sync with index
  springDeg.set(targetDeg);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (disabled) return;
      const next = Math.max(0, Math.min(values.length - 1, currentIndex + dir));
      onChange(next);
      navigator.vibrate?.(15);
    },
    [disabled, currentIndex, onChange, values.length]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      dragStart.current = { y: e.clientY, idx: currentIndex };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [disabled, currentIndex]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return;
      // Drag up = increase, drag down = decrease. ~4px per step.
      const dy = dragStart.current.y - e.clientY;
      const delta = Math.round(dy / 4);
      const next = Math.max(
        0,
        Math.min(values.length - 1, dragStart.current.idx + delta)
      );
      if (next !== currentIndex) {
        onChange(next);
        navigator.vibrate?.(8);
      }
    },
    [currentIndex, onChange, values.length]
  );

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const displayValue = `${values[currentIndex]}${unit}`;

  return (
    <div className={`knob-wrap${disabled ? " knob-wrap--disabled" : ""}`}>
      <span className="knob-label">{label}</span>

      <div className="knob-outer">
        {/* Arc progress behind the knob */}
        <ArcTrack progress={progress} color={accentColor} />

        {/* The physical knob */}
        <motion.div
          className="knob-body"
          style={{ rotate }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Grip serrations */}
          <div className="knob-grip" />
          {/* Inner face */}
          <div className="knob-face">
            {/* Indicator dot */}
            <div className="knob-dot" style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
          </div>
        </motion.div>
      </div>

      {/* Value + step buttons */}
      <div className="knob-value-row">
        <button
          className="knob-step"
          style={{ color: accentColor }}
          onClick={() => step(-1)}
          disabled={disabled || currentIndex === 0}
          aria-label={`Decrease ${label}`}
        >‹</button>
        <span className="knob-value" style={{ color: accentColor }}>
          {displayValue}
        </span>
        <button
          className="knob-step"
          style={{ color: accentColor }}
          onClick={() => step(1)}
          disabled={disabled || currentIndex === values.length - 1}
          aria-label={`Increase ${label}`}
        >›</button>
      </div>
    </div>
  );
}
