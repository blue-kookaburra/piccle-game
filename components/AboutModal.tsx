"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="about-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="about-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="about-header">
              <div>
                <p className="about-eyebrow">About Piccle</p>
                <p className="about-tagline">Develop your eye.</p>
              </div>
              <button className="about-close" onClick={onClose} aria-label="Close">✕</button>
            </div>

            {/* Scrollable body */}
            <div className="about-body">

              {/* What is Piccle */}
              <section className="about-section">
                <p className="about-text">
                  The global photography community has amazing photographers who produce incredible images.
                  Every day, Piccle serves up a handpicked frame to analyse.
                </p>
                <p className="about-text">
                Every image is a window into how a photographer read the moment.
                Shutter speed, aperture and focal length are key choices that created it.
                Your job is to reverse-engineer them to develop your eye for balancing scenes, subjects, shapes and light.
                </p>
              </section>

              {/* Three settings */}
              <section className="about-section">
                <h3 className="about-section-title">The Three Settings</h3>
                <div className="about-settings">
                  <div className="about-setting-row">
                    <span className="about-setting-label">Shutter Speed</span>
                    <p className="about-setting-desc">
                      How long the sensor drinks in light. Fast (1/1000s) freezes motion.
                      Slow (1s) trails it — and lets in far more light.
                    </p>
                  </div>
                  <div className="about-setting-row">
                    <span className="about-setting-label">Aperture</span>
                    <p className="about-setting-desc">
                      The iris of the lens. Fast (low number) apertures — wide open (f/1.4) — isolate
                      your subject in a creamy blur. Slow (high number) apertures — stopped down (f/16) —
                      keep everything sharp, front to back.
                    </p>
                  </div>
                  <div className="about-setting-row">
                    <span className="about-setting-label">Focal Length</span>
                    <p className="about-setting-desc">
                      The lens's angle of view. 24mm takes in the whole scene.
                      85mm flatters a face. 400mm compresses distance into layers.
                    </p>
                  </div>
                  <div className="about-setting-row">
                    <span className="about-setting-label">ISO</span>
                    <p className="about-setting-desc">
                      ISO is always shown to you — it is not something you need to guess.
                    </p>
                  </div>
                </div>
              </section>

              {/* Scoring */}
              <section className="about-section">
                <h3 className="about-section-title">Scoring</h3>
                <p className="about-text">
                  Round 1 always scores. From round 2 onward, you only earn points for
                  settings you improve on — getting yellow where you had red earns points;
                  repeating yellow earns nothing.
                </p>
                <div className="about-score-table">
                  <div className="about-score-row">
                    <span className="about-dot about-dot--green" />
                    <span className="about-score-label">Green — exact value</span>
                    <span className="about-score-pts">33% of round pool</span>
                  </div>
                  <div className="about-score-row">
                    <span className="about-dot about-dot--yellow" />
                    <span className="about-score-label">Yellow — within 2 clicks</span>
                    <span className="about-score-pts">10% of round pool</span>
                  </div>
                  <div className="about-score-row">
                    <span className="about-dot about-dot--red" />
                    <span className="about-score-label">Red — 3 or more clicks off</span>
                    <span className="about-score-pts">0 pts</span>
                  </div>
                </div>
                <p className="about-subtext">Round pools: 1000 → 500 → 250 → 125 → 60</p>
              </section>

              {/* Details — expandable */}
              <details className="about-details">
                <summary className="about-details-summary">Details</summary>
                <div className="about-details-body">
                  <div className="about-detail-item">
                    <span className="about-detail-label">Clicks</span>
                    <p className="about-detail-text">
                      A "click" is one step on the dial — one value up or down. Yellow means
                      you&apos;re within 2 clicks of the answer for that setting. For shutter speed,
                      that&apos;s roughly two adjacent stops. For aperture, it&apos;s within two 1/3-stop
                      increments. For focal length, it&apos;s the nearest two values in the list.
                    </p>
                  </div>
                  <div className="about-detail-item">
                    <span className="about-detail-label">Crop sensors</span>
                    <p className="about-detail-text">
                      Focal length answers are the number stamped on the lens — not full-frame
                      equivalents. If a shot was taken on an APS-C body with a 35mm lens, the
                      answer is 35mm. The crop factor of the camera is noted in each challenge.
                    </p>
                  </div>
                  <div className="about-detail-item">
                    <span className="about-detail-label">Snapping</span>
                    <p className="about-detail-text">
                      Camera settings don&apos;t always land exactly on a standard value. Where the
                      original image data (EXIF data) falls between two options, the answer is snapped to the
                      nearest value available on Piccle's dials.
                    </p>
                  </div>
                  <div className="about-detail-item">
                    <span className="about-detail-label">Ranges</span>
                    <p className="about-detail-text">
                      Shutter: 1/8000s to 60s. Aperture: f/1 to f/22. Focal length: 10mm to 400mm.
                      All values in the game fall within these bands.
                    </p>
                  </div>
                  <div className="about-detail-item">
                    <span className="about-detail-label">New frame</span>
                    <p className="about-detail-text">
                      One new photograph every day. Results reset at midnight local time.
                      Your streak counts consecutive days played.
                    </p>
                  </div>
                </div>
              </details>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
