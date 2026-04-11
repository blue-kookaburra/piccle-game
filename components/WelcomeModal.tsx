"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTutorial: () => void;
}

export default function WelcomeModal({ isOpen, onClose, onTutorial }: WelcomeModalProps) {
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
            className="about-card welcome-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="welcome-body">
              {/* Headline */}
              <div className="welcome-header">
                <p className="welcome-title">First time Piccler?</p>
                <p className="welcome-tagline">Welcome to the daily challenge for photographers</p>
              </div>

              {/* Objective */}
              <div className="welcome-section">
                <p className="welcome-text">
                  Every day we serve up a new handpicked photograph. Your job is to reverse-engineer the
                  three camera settings used to take it — <strong>shutter speed</strong>, <strong>aperture</strong>, and <strong>focal length</strong>.
                </p>
                <p className="welcome-text">
                  Spin the dials to your best guess and hit <strong>SHOOT</strong>. You get up to 5 attempts.
                  Each shot tells you how close you are — green means exact, yellow means close, red means off.
                  The sooner you get the answer, the more points you get.
                  Build the daily habit to train your eye and grow your streak.
                </p>
              </div>

              {/* HOW TO pointer */}
              <div className="welcome-hint-block">
                <span className="welcome-hint">
                  Tap <strong className="welcome-hint-btn">HOW TO</strong> in the top bar for the full rules, scoring, and tips.
                </span>
              </div>

              {/* Tutorial CTA */}
              <div className="welcome-tutorial-block">
                <p className="welcome-tutorial-text">New to photography? Learn the key settings in your camera.</p>
                <button
                  className="welcome-tutorial-btn"
                  onClick={() => { onClose(); onTutorial(); }}
                >
                  PLAY THE TUTORIAL
                </button>
              </div>

              {/* CTA */}
              <button className="welcome-cta" onClick={onClose}>
                LET&apos;S GO
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
