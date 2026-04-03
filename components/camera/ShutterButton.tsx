"use client";

import { motion } from "framer-motion";

interface ShutterButtonProps {
  cx: number;
  cy: number;
  r: number;
  onFire: () => void;
  disabled: boolean;
  firing: boolean;
}

export default function ShutterButton({
  cx,
  cy,
  r,
  onFire,
  disabled,
  firing,
}: ShutterButtonProps) {
  return (
    <g>
      <defs>
        <radialGradient id="btn-grad" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor={firing ? "#e05050" : "#b0a898"} />
          <stop offset="100%" stopColor={firing ? "#8b2020" : "#4a4440"} />
        </radialGradient>
        <filter id="btn-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.7" />
        </filter>
      </defs>

      {/* Raised rim */}
      <circle
        cx={cx}
        cy={cy + 1}
        r={r + 2}
        fill="#111"
        filter="url(#btn-shadow)"
      />

      {/* Button body */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="url(#btn-grad)"
        stroke="#555"
        strokeWidth="0.8"
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
        animate={
          firing
            ? { r: [r, r * 0.85, r * 1.05, r] }
            : {}
        }
        transition={{ duration: 0.22, times: [0, 0.3, 0.7, 1] }}
        whileTap={disabled ? undefined : { r: r * 0.87, cy: cy + 1.5 }}
        onClick={disabled ? undefined : onFire}
      />

      {/* Center red dot */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r * 0.35}
        fill={firing ? "#ff4444" : "#cc3333"}
        style={{ pointerEvents: "none" }}
        animate={firing ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
        transition={firing ? { duration: 0.4, repeat: Infinity } : {}}
      />
    </g>
  );
}
