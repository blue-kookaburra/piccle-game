"use client";

import { useRef } from "react";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";
import type { AttemptFeedback } from "@/lib/scoring";
import CameraRing from "./CameraRing";
import ShutterDial from "./ShutterDial";
import ShutterButton from "./ShutterButton";

// Camera body dimensions (viewBox units)
const VW = 400;
const VH = 280;
const LENS_CX = 195;
const LENS_CY = 148;

interface CameraBodySVGProps {
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

export default function CameraBodySVG({
  shutterIdx,
  apertureIdx,
  focalIdx,
  onShutterChange,
  onApertureChange,
  onFocalChange,
  onFire,
  disabled,
  firing,
  lastAttemptFeedback,
}: CameraBodySVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <div className="camera-perspective-wrap">
      <div className="camera-3d-tilt">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          className="camera-svg-container"
          style={{ display: "block", touchAction: "none" }}
          aria-label="Camera controls"
        >
          <defs>
            {/* Camera body gradient */}
            <radialGradient id="body-grad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#282828" />
              <stop offset="70%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#111" />
            </radialGradient>

            {/* Lens barrel gradient */}
            <radialGradient id="barrel-grad" cx="42%" cy="38%" r="58%">
              <stop offset="0%" stopColor="#2e2e2e" />
              <stop offset="100%" stopColor="#141414" />
            </radialGradient>

            {/* Lens glass gradient */}
            <radialGradient id="glass-grad" cx="38%" cy="32%" r="62%">
              <stop offset="0%" stopColor="#0e1540" />
              <stop offset="40%" stopColor="#0a0e2a" />
              <stop offset="100%" stopColor="#040814" />
            </radialGradient>

            {/* Lens shimmer/coating overlay */}
            <radialGradient id="shimmer-grad" cx="35%" cy="28%" r="55%">
              <stop offset="0%" stopColor="#4060ff" stopOpacity="0.18" />
              <stop offset="40%" stopColor="#8020c0" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#001040" stopOpacity="0" />
            </radialGradient>

            {/* Hot shoe gradient */}
            <linearGradient id="shoe-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#555" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </linearGradient>

            {/* Grip pattern */}
            <pattern id="grip-pattern" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="#0d0d0d" strokeWidth="1.5" />
            </pattern>

            {/* Body drop shadow filter */}
            <filter id="body-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.8" />
            </filter>

            {/* Inner barrel shadow */}
            <filter id="barrel-inner" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ── Camera body ── */}
          <rect
            x="14" y="12"
            width={VW - 28} height={VH - 24}
            rx="20"
            fill="url(#body-grad)"
            filter="url(#body-shadow)"
          />

          {/* Body highlight rim */}
          <rect
            x="14" y="12"
            width={VW - 28} height={VH - 24}
            rx="20"
            fill="none"
            stroke="#3a3a3a"
            strokeWidth="1"
          />
          <rect
            x="15" y="13"
            width={VW - 30} height={VH - 26}
            rx="19"
            fill="none"
            stroke="#111"
            strokeWidth="0.5"
          />

          {/* ── Grip texture (left side) ── */}
          <rect
            x="14" y="12"
            width="55" height={VH - 24}
            rx="20"
            fill="url(#grip-pattern)"
            opacity="0.7"
          />
          {/* Grip edge fade */}
          <rect
            x="55" y="12"
            width="20" height={VH - 24}
            fill="url(#body-grad)"
            opacity="0.9"
          />

          {/* ── Hot shoe (top center) ── */}
          <rect
            x={LENS_CX - 25} y="14"
            width="50" height="12"
            rx="2"
            fill="url(#shoe-grad)"
            stroke="#222"
            strokeWidth="0.5"
          />
          <rect
            x={LENS_CX - 20} y="17"
            width="40" height="3"
            rx="1"
            fill="#666"
            opacity="0.4"
          />

          {/* ── Mode dial (top left, decorative) ── */}
          <circle cx="70" cy="38" r="18" fill="#1e1e1e" stroke="#333" strokeWidth="1" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * 2 * Math.PI - Math.PI / 2;
            return (
              <line
                key={i}
                x1={70 + 13 * Math.cos(a)}
                y1={38 + 13 * Math.sin(a)}
                x2={70 + 17 * Math.cos(a)}
                y2={38 + 17 * Math.sin(a)}
                stroke="#444"
                strokeWidth="1"
              />
            );
          })}
          <circle cx="70" cy="38" r="8" fill="#181818" stroke="#444" strokeWidth="0.5" />
          <text x="70" y="38" textAnchor="middle" dominantBaseline="central" fill="#888" fontSize="5" fontFamily="'Courier New', monospace" fontWeight="700">M</text>

          {/* ── Panel screws (corners) ── */}
          {[
            [30, 30], [VW - 30, 30], [30, VH - 30], [VW - 30, VH - 30],
          ].map(([sx, sy], i) => (
            <g key={i}>
              <circle cx={sx} cy={sy} r="5" fill="radial-gradient(circle, #3a3a3a, #1a1a1a)" />
              <circle cx={sx} cy={sy} r="5" fill="#252525" stroke="#111" strokeWidth="0.5" />
              <circle cx={sx} cy={sy} r="5" fill="none" stroke="#383838" strokeWidth="0.5" />
              {/* Slot */}
              <line
                x1={sx - 3} y1={sy - 3}
                x2={sx + 3} y2={sy + 3}
                stroke="#111" strokeWidth="1.2"
              />
            </g>
          ))}

          {/* ── Lens barrel mount ── */}
          <circle cx={LENS_CX} cy={LENS_CY} r="110" fill="#0f0f0f" stroke="#222" strokeWidth="1" />
          <circle cx={LENS_CX} cy={LENS_CY} r="107" fill="url(#barrel-grad)" />

          {/* Barrel mount ring highlight */}
          <circle cx={LENS_CX} cy={LENS_CY} r="107" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
          <circle cx={LENS_CX} cy={LENS_CY} r="106" fill="none" stroke="#111" strokeWidth="0.5" />

          {/* ── Focal length ring (outermost) ── */}
          <CameraRing
            id="focal"
            cx={LENS_CX}
            cy={LENS_CY}
            outerR={98}
            innerR={78}
            values={FOCAL_LENGTHS}
            currentIndex={focalIdx}
            onChange={onFocalChange}
            disabled={disabled}
            tickColor="#9a9a9a"
            labelColor="#b0b0b0"
            ringFill="#2c2c2e"
            unit="mm"
            feedback={lastAttemptFeedback?.focal}
            svgRef={svgRef}
          />

          {/* ── Aperture ring (middle) ── */}
          <CameraRing
            id="aperture"
            cx={LENS_CX}
            cy={LENS_CY}
            outerR={74}
            innerR={56}
            values={APERTURES}
            currentIndex={apertureIdx}
            onChange={onApertureChange}
            disabled={disabled}
            tickColor="#c8901a"
            labelColor="#e2b35a"
            ringFill="#35302a"
            feedback={lastAttemptFeedback?.aperture}
            svgRef={svgRef}
          />

          {/* ── Fixed inner reference ring ── */}
          <circle cx={LENS_CX} cy={LENS_CY} r="54" fill="#1c1c1c" stroke="#3a3a3a" strokeWidth="1" />
          <circle cx={LENS_CX} cy={LENS_CY} r="53" fill="none" stroke="#111" strokeWidth="0.5" />

          {/* ── Lens glass ── */}
          <circle cx={LENS_CX} cy={LENS_CY} r="48" fill="url(#glass-grad)" />
          {/* Coating shimmer */}
          <circle cx={LENS_CX} cy={LENS_CY} r="48" fill="url(#shimmer-grad)" />
          {/* Lens reflection arc */}
          <path
            d={`M ${LENS_CX - 28} ${LENS_CY - 28} Q ${LENS_CX - 10} ${LENS_CY - 38} ${LENS_CX + 18} ${LENS_CY - 32}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Lens glass rim */}
          <circle cx={LENS_CX} cy={LENS_CY} r="48" fill="none" stroke="#1a2050" strokeWidth="1.5" />
          <circle cx={LENS_CX} cy={LENS_CY} r="47" fill="none" stroke="#0a0820" strokeWidth="0.5" />

          {/* Lens center depth circles */}
          <circle cx={LENS_CX} cy={LENS_CY} r="30" fill="none" stroke="rgba(30,40,100,0.5)" strokeWidth="0.8" />
          <circle cx={LENS_CX} cy={LENS_CY} r="16" fill="#030610" stroke="rgba(20,30,80,0.4)" strokeWidth="0.8" />
          <circle cx={LENS_CX} cy={LENS_CY} r="8" fill="#010408" />

          {/* ── Shutter speed dial (top right area) ── */}
          <ShutterDial
            cx={330}
            cy={55}
            r={32}
            values={SHUTTER_SPEEDS}
            currentIndex={shutterIdx}
            onChange={onShutterChange}
            disabled={disabled}
            svgRef={svgRef}
          />

          {/* Shutter dial label */}
          <text
            x="330" y="96"
            textAnchor="middle"
            fill="#888"
            fontSize="5"
            fontFamily="'Courier New', monospace"
            fontWeight="700"
            letterSpacing="0.12em"
          >
            SHUTTER
          </text>

          {/* ── Shutter release button ── */}
          <ShutterButton
            cx={330}
            cy={155}
            r={22}
            onFire={onFire}
            disabled={disabled}
            firing={firing}
          />

          {/* Fire label */}
          <text
            x="330" y="184"
            textAnchor="middle"
            fill={disabled ? "#333" : "#e2b35a"}
            fontSize="5"
            fontFamily="'Courier New', monospace"
            fontWeight="700"
            letterSpacing="0.1em"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {firing ? "..." : "SHOOT"}
          </text>

          {/* ── Label: current values displayed below lens ── */}
          <text
            x={LENS_CX - 50} y={VH - 18}
            fill="#e2b35a"
            fontSize="7.5"
            fontFamily="'Courier New', monospace"
            fontWeight="700"
            letterSpacing="0.06em"
            style={{ userSelect: "none" }}
          >
            {SHUTTER_SPEEDS[shutterIdx]}
          </text>
          <text
            x={LENS_CX} y={VH - 18}
            textAnchor="middle"
            fill="#e2b35a"
            fontSize="7.5"
            fontFamily="'Courier New', monospace"
            fontWeight="700"
            letterSpacing="0.06em"
            style={{ userSelect: "none" }}
          >
            {APERTURES[apertureIdx]}
          </text>
          <text
            x={LENS_CX + 50} y={VH - 18}
            textAnchor="end"
            fill="#e2b35a"
            fontSize="7.5"
            fontFamily="'Courier New', monospace"
            fontWeight="700"
            letterSpacing="0.06em"
            style={{ userSelect: "none" }}
          >
            {FOCAL_LENGTHS[focalIdx]}mm
          </text>
        </svg>
      </div>
    </div>
  );
}
