"use client";

import dynamic from "next/dynamic";
import type { AttemptFeedback } from "@/lib/scoring";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";

// Canvas must be client-only — skip SSR
const Camera3D = dynamic(() => import("./camera/Camera3D"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "clamp(280px, 55vw, 360px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#444",
        fontSize: "12px",
        fontFamily: "monospace",
        letterSpacing: "0.1em",
      }}
    >
      LOADING CAMERA…
    </div>
  ),
});

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

export default function CameraBody(props: CameraBodyProps) {
  const {
    shutterIdx, apertureIdx, focalIdx,
    onShutterChange, onApertureChange, onFocalChange,
    disabled,
  } = props;

  const step = (current: number, max: number, dir: 1 | -1, setter: (i: number) => void) => {
    const next = Math.max(0, Math.min(max - 1, current + dir));
    setter(next);
    navigator.vibrate?.(15);
  };

  return (
    <div className="camera-wrap">
      {/* 3D camera scene */}
      <Camera3D {...props} />

      {/* Value readout bar */}
      <div className="dial-readout">
        <span className="dial-readout-item" style={{ color: "#e2b35a" }}>
          {SHUTTER_SPEEDS[shutterIdx]}
        </span>
        <span className="dial-readout-sep">·</span>
        <span className="dial-readout-item" style={{ color: "#e2b35a" }}>
          {APERTURES[apertureIdx]}
        </span>
        <span className="dial-readout-sep">·</span>
        <span className="dial-readout-item" style={{ color: "#e2b35a" }}>
          {FOCAL_LENGTHS[focalIdx]}mm
        </span>
      </div>

      {/* Fallback step controls */}
      <div className="dial-fallback-row">
        <div className="dial-fallback-group">
          <span className="dial-fallback-label">SHUTTER</span>
          <div className="dial-fallback-btns">
            <button
              className="knob-step"
              style={{ color: "#e2b35a" }}
              onClick={() => step(shutterIdx, SHUTTER_SPEEDS.length, -1, onShutterChange)}
              disabled={disabled || shutterIdx === 0}
              aria-label="Decrease shutter speed"
            >‹</button>
            <button
              className="knob-step"
              style={{ color: "#e2b35a" }}
              onClick={() => step(shutterIdx, SHUTTER_SPEEDS.length, 1, onShutterChange)}
              disabled={disabled || shutterIdx === SHUTTER_SPEEDS.length - 1}
              aria-label="Increase shutter speed"
            >›</button>
          </div>
        </div>

        <div className="dial-fallback-group">
          <span className="dial-fallback-label">APERTURE</span>
          <div className="dial-fallback-btns">
            <button
              className="knob-step"
              style={{ color: "#e2b35a" }}
              onClick={() => step(apertureIdx, APERTURES.length, -1, onApertureChange)}
              disabled={disabled || apertureIdx === 0}
              aria-label="Decrease aperture"
            >‹</button>
            <button
              className="knob-step"
              style={{ color: "#e2b35a" }}
              onClick={() => step(apertureIdx, APERTURES.length, 1, onApertureChange)}
              disabled={disabled || apertureIdx === APERTURES.length - 1}
              aria-label="Increase aperture"
            >›</button>
          </div>
        </div>

        <div className="dial-fallback-group">
          <span className="dial-fallback-label">FOCAL</span>
          <div className="dial-fallback-btns">
            <button
              className="knob-step"
              style={{ color: "#e2b35a" }}
              onClick={() => step(focalIdx, FOCAL_LENGTHS.length, -1, onFocalChange)}
              disabled={disabled || focalIdx === 0}
              aria-label="Decrease focal length"
            >‹</button>
            <button
              className="knob-step"
              style={{ color: "#e2b35a" }}
              onClick={() => step(focalIdx, FOCAL_LENGTHS.length, 1, onFocalChange)}
              disabled={disabled || focalIdx === FOCAL_LENGTHS.length - 1}
              aria-label="Increase focal length"
            >›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
