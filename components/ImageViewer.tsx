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

  const metaLine = [
    camera,
    iso ? `ISO ${iso}` : undefined,
    photographer ? `${photographer}` : undefined,
  ]
    .filter(Boolean)
    .join("  ·  ");

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
            <span className="challenge-badge">Frame {challengeNumber}</span>
          </div>
          <div className="overlay-bottom">
            {metaLine && (
              <div className="photo-meta-overlay">
                <span className="photo-meta-line">{metaLine}</span>
              </div>
            )}
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
            onClick={() => setExpanded(false)}
          >
            <motion.img
              src={imageUrl}
              alt={`Frame ${challengeNumber}`}
              className="lightbox-image"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            />
            {credit && <p className="lightbox-credit">Photo: {credit}</p>}
            <button className="lightbox-close" onClick={() => setExpanded(false)}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
