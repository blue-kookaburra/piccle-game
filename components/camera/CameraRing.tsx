"use client";

import { useRef, useCallback } from "react";
import { motion, useTransform } from "framer-motion";
import { useCameraRing } from "./useCameraRing";
import type { FeedbackColor } from "@/lib/camera-values";

interface CameraRingProps {
  id: string;
  cx: number;
  cy: number;
  outerR: number;
  innerR: number;
  values: (string | number)[];
  currentIndex: number;
  onChange: (i: number) => void;
  disabled?: boolean;
  tickColor: string;
  labelColor: string;
  ringFill: string;
  unit?: string;
  feedback?: FeedbackColor;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export default function CameraRing({
  id,
  cx,
  cy,
  outerR,
  innerR,
  values,
  currentIndex,
  onChange,
  disabled = false,
  tickColor,
  labelColor,
  ringFill,
  unit = "",
  feedback,
  svgRef,
}: CameraRingProps) {
  const glowRef = useRef<SVGCircleElement>(null);

  // Convert SVG viewBox coords → screen coords for drag angle calculation
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
  const midR = (outerR + innerR) / 2;
  const labelR = midR - 4;

  // Build tick marks
  const ticks: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const tickLen = isMajor ? 10 : 6;
    const r1 = outerR - 2;
    const r2 = outerR - 2 - tickLen;
    ticks.push(
      <line
        key={i}
        x1={cx + r1 * Math.cos(angle)}
        y1={cy + r1 * Math.sin(angle)}
        x2={cx + r2 * Math.cos(angle)}
        y2={cy + r2 * Math.sin(angle)}
        stroke={isMajor ? tickColor : `${tickColor}66`}
        strokeWidth={isMajor ? 1.5 : 0.8}
      />
    );
  }

  // Labels — only every 4th value to avoid crowding
  const labels: React.ReactElement[] = [];
  for (let i = 0; i < n; i += 4) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const lx = cx + labelR * Math.cos(angle);
    const ly = cy + labelR * Math.sin(angle);
    const rotateDeg = (i / n) * 360;
    labels.push(
      <text
        key={i}
        x={lx}
        y={ly}
        textAnchor="middle"
        dominantBaseline="central"
        fill={labelColor}
        fontSize="5.5"
        fontFamily="'Courier New', monospace"
        fontWeight="700"
        letterSpacing="0.03em"
        transform={`rotate(${rotateDeg}, ${lx}, ${ly})`}
        style={{ userSelect: "none" }}
      >
        {`${values[i]}${unit}`}
      </text>
    );
  }

  // Annular path (doughnut) for pointer events
  const annularPath = `
    M ${cx} ${cy - outerR}
    A ${outerR} ${outerR} 0 1 1 ${cx - 0.001} ${cy - outerR}
    Z
    M ${cx} ${cy - innerR}
    A ${innerR} ${innerR} 0 1 0 ${cx - 0.001} ${cy - innerR}
    Z
  `;

  // Feedback glow color
  const glowColor =
    feedback === "green"
      ? "#22c55e"
      : feedback === "yellow"
      ? "#eab308"
      : "#ef4444";
  const hasGlow = !!feedback;

  return (
    <g
      style={{ cursor: disabled ? "default" : "grab", opacity: disabled ? 0.4 : 1 }}
      onPointerDown={disabled ? undefined : onPointerDown}
      onPointerMove={disabled ? undefined : onPointerMove}
      onPointerUp={disabled ? undefined : onPointerUp}
      onPointerCancel={disabled ? undefined : onPointerUp}
      onWheel={disabled ? undefined : onWheel}
    >
      {/* Defs for this ring */}
      <defs>
        <radialGradient id={`ring-fill-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={ringFill} stopOpacity="1" />
          <stop offset="100%" stopColor={ringFill} stopOpacity="0.85" />
        </radialGradient>
        <clipPath id={`ring-clip-${id}`}>
          <path d={annularPath} fillRule="evenodd" />
        </clipPath>
        {hasGlow && (
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      {/* Static ring base — always visible */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill={`url(#ring-fill-${id})`}
        stroke="#111"
        strokeWidth="0.5"
      />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#111" strokeWidth="0.5" />

      {/* Knurl texture stripes clipped to annular shape */}
      <g clipPath={`url(#ring-clip-${id})`}>
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * 2 * Math.PI;
          return (
            <line
              key={i}
              x1={cx + (innerR + 1) * Math.cos(a)}
              y1={cy + (innerR + 1) * Math.sin(a)}
              x2={cx + (outerR - 1) * Math.cos(a)}
              y2={cy + (outerR - 1) * Math.sin(a)}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="1.2"
            />
          );
        })}
      </g>

      {/* Rotating group: ticks + labels */}
      <motion.g style={{ transform: rotate } as unknown as React.CSSProperties}>
        {ticks}
        {labels}
      </motion.g>

      {/* Feedback glow ring */}
      {hasGlow && (
        <motion.circle
          ref={glowRef}
          cx={cx}
          cy={cy}
          r={(outerR + innerR) / 2}
          fill="none"
          stroke={glowColor}
          strokeWidth={outerR - innerR}
          strokeOpacity={0}
          filter={`url(#glow-${id})`}
          animate={{ strokeOpacity: [0, 0.7, 0] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      )}

      {/* Indicator notch at 12 o'clock (top) — fixed */}
      <polygon
        points={`${cx},${cy - outerR - 1} ${cx - 3},${cy - outerR - 7} ${cx + 3},${cy - outerR - 7}`}
        fill={labelColor}
        opacity="0.9"
      />

      {/* Invisible hit area covering the ring */}
      <path
        d={annularPath}
        fillRule="evenodd"
        fill="transparent"
        style={{ cursor: disabled ? "default" : "grab" }}
      />
    </g>
  );
}
