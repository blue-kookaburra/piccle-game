"use client";

import { useCallback } from "react";
import { motion, useTransform } from "framer-motion";
import { useCameraRing } from "./useCameraRing";

interface ShutterDialProps {
  cx: number;
  cy: number;
  r: number;
  values: (string | number)[];
  currentIndex: number;
  onChange: (i: number) => void;
  disabled?: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export default function ShutterDial({
  cx,
  cy,
  r,
  values,
  currentIndex,
  onChange,
  disabled = false,
  svgRef,
}: ShutterDialProps) {
  const getCenterScreen = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const scaleX = rect.width / vb.width;
    const scaleY = rect.height / vb.height;
    return {
      x: rect.left + cx * scaleX,
      y: rect.top + cy * scaleY,
    };
  }, [svgRef, cx, cy]);

  const { springDeg, onPointerDown, onPointerMove, onPointerUp, onWheel } =
    useCameraRing(values, currentIndex, onChange, getCenterScreen);

  const rotate = useTransform(springDeg, (d) => `rotate(${d}, ${cx}, ${cy})`);

  const n = values.length;
  const innerR = r * 0.55;

  // Radial labels on the dial face
  const labels: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const lx = cx + (r - 8) * Math.cos(angle);
    const ly = cy + (r - 8) * Math.sin(angle);
    const rotateDeg = (i / n) * 360;
    const label = String(values[i]);
    // Shorten long labels: "1/8000" → "8000", "1/500" → "500", "30s" → "30"
    const short = label.startsWith("1/")
      ? label.slice(2)
      : label.replace("s", "");
    labels.push(
      <text
        key={i}
        x={lx}
        y={ly}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#c8c0b0"
        fontSize="4"
        fontFamily="'Courier New', monospace"
        fontWeight="700"
        transform={`rotate(${rotateDeg}, ${lx}, ${ly})`}
        style={{ userSelect: "none" }}
      >
        {short}
      </text>
    );
  }

  // Tick marks
  const ticks: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const r1 = r - 1;
    const r2 = r - 5;
    ticks.push(
      <line
        key={i}
        x1={cx + r1 * Math.cos(angle)}
        y1={cy + r1 * Math.sin(angle)}
        x2={cx + r2 * Math.cos(angle)}
        y2={cy + r2 * Math.sin(angle)}
        stroke="#888"
        strokeWidth="1"
      />
    );
  }

  return (
    <g
      style={{ cursor: disabled ? "default" : "grab", opacity: disabled ? 0.4 : 1 }}
      onPointerDown={disabled ? undefined : onPointerDown}
      onPointerMove={disabled ? undefined : onPointerMove}
      onPointerUp={disabled ? undefined : onPointerUp}
      onPointerCancel={disabled ? undefined : onPointerUp}
      onWheel={disabled ? undefined : onWheel}
    >
      <defs>
        <radialGradient id="dial-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3a3632" />
          <stop offset="100%" stopColor="#1a1714" />
        </radialGradient>
      </defs>

      {/* Outer surround ring (fixed, decorative) */}
      <circle cx={cx} cy={cy} r={r + 4} fill="#111" stroke="#333" strokeWidth="1" />

      {/* Rotating dial body */}
      <motion.g style={{ transform: rotate } as unknown as React.CSSProperties}>
        <circle cx={cx} cy={cy} r={r} fill="url(#dial-grad)" />
        {/* Knurl texture */}
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * 2 * Math.PI;
          return (
            <line
              key={i}
              x1={cx + (innerR + 1) * Math.cos(a)}
              y1={cy + (innerR + 1) * Math.sin(a)}
              x2={cx + (r - 1) * Math.cos(a)}
              y2={cy + (r - 1) * Math.sin(a)}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1"
            />
          );
        })}
        {ticks}
        {labels}
        {/* Center logo dot */}
        <circle cx={cx} cy={cy} r={innerR * 0.5} fill="#2a2624" stroke="#444" strokeWidth="0.5" />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#e2b35a"
          fontSize="5"
          fontFamily="'Courier New', monospace"
          fontWeight="700"
          letterSpacing="0.05em"
          style={{ userSelect: "none" }}
        >
          S
        </text>
      </motion.g>

      {/* Fixed indicator notch at top */}
      <polygon
        points={`${cx},${cy - r - 2} ${cx - 3},${cy - r - 8} ${cx + 3},${cy - r - 8}`}
        fill="#e2b35a"
        opacity="0.95"
      />

      {/* Invisible hit area */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="transparent"
        style={{ cursor: disabled ? "default" : "grab" }}
      />
    </g>
  );
}
