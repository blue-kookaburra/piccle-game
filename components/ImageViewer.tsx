"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageViewerProps {
  imageUrl: string;
  challengeNumber: number;
  credit?: string;
  camera?: string;
  iso?: number;
  photographer?: string;
}

// Strip duplicate Make prefix: "Nikon Corporation Nikon D750" → "Nikon D750"
function cleanCamera(raw: string): string {
  const words = raw.trim().split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    if (words[i].toLowerCase() === words[0].toLowerCase()) {
      return words.slice(i).join(' ');
    }
  }
  return raw;
}

function dist(a: React.Touch, b: React.Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export default function ImageViewer({
  imageUrl,
  challengeNumber,
  credit,
  camera,
  iso,
  photographer,
}: ImageViewerProps) {
  const [expanded, setExpanded] = useState(false);

  // Zoom/pan state — updated via ref during gesture, committed to state on end
  const [scale, setScale]   = useState(1);
  const [pan,   setPan]     = useState({ x: 0, y: 0 });

  // Gesture tracking refs — no re-renders during move
  const activeScale    = useRef(1);
  const activePan      = useRef({ x: 0, y: 0 });
  const lastDist       = useRef<number | null>(null);
  const lastTouchPos   = useRef<{ x: number; y: number } | null>(null);
  const isGesturing    = useRef(false);
  const lastTapTime    = useRef<number>(0);

  const SCALE_MIN = 1;
  const SCALE_MAX = 5;

  function resetZoom() {
    activeScale.current = 1;
    activePan.current   = { x: 0, y: 0 };
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  function close() {
    resetZoom();
    setExpanded(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      // Pinch start
      lastDist.current     = dist(e.touches[0], e.touches[1]);
      lastTouchPos.current = null;
      isGesturing.current  = true;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        // Double-tap → reset zoom
        resetZoom();
        lastTapTime.current = 0;
        return;
      }
      lastTapTime.current  = now;
      // Single-finger pan (only when zoomed in)
      if (activeScale.current > 1) {
        lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isGesturing.current  = true;
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault(); // prevent page scroll/zoom during gesture

    if (e.touches.length === 2 && lastDist.current !== null) {
      // Pinch → scale
      const newDist  = dist(e.touches[0], e.touches[1]);
      const delta    = newDist / lastDist.current;
      lastDist.current = newDist;

      const newScale = clamp(activeScale.current * delta, SCALE_MIN, SCALE_MAX);
      // Clamp pan when zooming out
      if (newScale <= 1) {
        activePan.current = { x: 0, y: 0 };
      }
      activeScale.current = newScale;
      setScale(newScale);
    } else if (e.touches.length === 1 && lastTouchPos.current && activeScale.current > 1) {
      // Drag → pan
      const dx = e.touches[0].clientX - lastTouchPos.current.x;
      const dy = e.touches[0].clientY - lastTouchPos.current.y;
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      // Rough pan limit based on scale (prevents dragging image fully off screen)
      const limit = (activeScale.current - 1) * 200;
      activePan.current = {
        x: clamp(activePan.current.x + dx, -limit, limit),
        y: clamp(activePan.current.y + dy, -limit, limit),
      };
      setPan({ ...activePan.current });
    }
  }

  function handleTouchEnd() {
    lastDist.current     = null;
    lastTouchPos.current = null;
    isGesturing.current  = false;

    // Snap back if nearly at 1×
    if (activeScale.current < 1.05) {
      resetZoom();
    }
  }

  // Camera spec line: "Sony A7C II · ISO 400"
  const specLine = [camera ? cleanCamera(camera) : null, iso ? `ISO ${iso}` : null]
    .filter(Boolean).join("  ·  ");

  const imgTransform = `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`;
  const imgTransition = isGesturing.current ? "none" : "transform 0.2s ease";

  return (
    <>
      <div className="image-container" onClick={() => setExpanded(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Frame ${challengeNumber}`}
          className="challenge-image"
        />

        <div className="image-overlay">
          <div className="overlay-top">
            {/* Frame number — top left, understated */}
            <span className="challenge-badge">Frame {challengeNumber}</span>
          </div>

          <div className="overlay-bottom">
            <div className="photo-meta-overlay">
              {specLine && (
                <span className="photo-meta-camera">{specLine}</span>
              )}
              {photographer && (
                <span className="photo-meta-credit">{photographer}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={scale <= 1 ? close : undefined}
          >
            {/* Touch-gesture container — intercepts pinch/pan, does not use framer-motion */}
            <div
              style={{ touchAction: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Frame ${challengeNumber}`}
                className="lightbox-image"
                draggable={false}
                style={{
                  transform: imgTransform,
                  transition: imgTransition,
                  cursor: scale > 1 ? "grab" : "default",
                  userSelect: "none",
                }}
              />
            </div>

            {credit && (
              <p className="lightbox-credit">Photo: {credit}</p>
            )}
            <button className="lightbox-close" onClick={close}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
