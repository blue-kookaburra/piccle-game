"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageViewerProps {
  imageUrl: string;
  challengeNumber: number;
  credit?: string;
  camera?: string;
  iso?: number;
  photographer?: string;
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

  // Camera spec line: "Sony A7C II · ISO 400"
  const specLine = [camera, iso ? `ISO ${iso}` : null].filter(Boolean).join("  ·  ");

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
            onClick={() => setExpanded(false)}
          >
            <motion.img
              src={imageUrl}
              alt={`Frame ${challengeNumber}`}
              className="lightbox-image"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            />
            {credit && (
              <p className="lightbox-credit">Photo: {credit}</p>
            )}
            <button className="lightbox-close" onClick={() => setExpanded(false)}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
