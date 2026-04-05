"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPersonalStats, type PersonalStats, type SettingAccuracy } from "@/lib/personal-stats";

function AccuracyBar({ acc, label }: { acc: SettingAccuracy; label: string }) {
  const pct = acc.green;
  const quality = pct >= 60 ? "good" : pct >= 35 ? "mid" : "weak";
  return (
    <div className="accuracy-row">
      <div className="accuracy-label-row">
        <span className="accuracy-label">{label}</span>
        <span className="accuracy-pct">{pct}% sharp</span>
      </div>
      <div className="accuracy-bar-track">
        <div
          className={`accuracy-bar-fill accuracy-bar-fill--${quality}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<PersonalStats | null | "loading">("loading");

  useEffect(() => {
    setStats(getPersonalStats());
  }, []);

  if (stats === "loading") {
    return (
      <main className="stats-layout">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>developing...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="stats-layout">
      <header className="stats-header">
        <Link href="/" className="stats-back">←</Link>
        <h1 className="stats-title">Your Stats</h1>
      </header>

      {stats === null ? (
        <div className="stats-body">
          <div className="stats-empty">
            <span className="stats-empty-icon">◎</span>
            <p>No frames developed yet.</p>
            <p style={{ fontSize: "11px", opacity: 0.6 }}>Play your first game to see stats here.</p>
          </div>
        </div>
      ) : (
        <div className="stats-body">
          {/* Overview tiles */}
          <div className="stats-overview">
            <div className="stats-tile">
              <span className="stats-tile-value stats-tile-value--hot">{stats.bestScore}</span>
              <span className="stats-tile-label">Best score</span>
            </div>
            <div className="stats-tile">
              <span className="stats-tile-value">{stats.avgScore}</span>
              <span className="stats-tile-label">Avg score</span>
            </div>
            <div className="stats-tile">
              <span className="stats-tile-value">{stats.gamesPlayed}</span>
              <span className="stats-tile-label">Frames</span>
            </div>
            <div className="stats-tile">
              <span className="stats-tile-value">{stats.solveRate}%</span>
              <span className="stats-tile-label">Solved</span>
            </div>
          </div>

          {/* Streak */}
          {stats.currentStreak > 0 && (
            <div className="stats-tile" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>🔥</span>
              <div>
                <div className="stats-tile-value" style={{ fontSize: 20 }}>
                  {stats.currentStreak} frames straight
                </div>
                {stats.longestStreak > stats.currentStreak && (
                  <div className="stats-tile-label">
                    longest: {stats.longestStreak}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Setting accuracy */}
          <div>
            <div className="stats-section-title">Setting accuracy</div>
            <div className="stats-accuracy">
              <AccuracyBar acc={stats.shutter}  label="Shutter" />
              <AccuracyBar acc={stats.aperture} label="Aperture" />
              <AccuracyBar acc={stats.focal}    label="Focal length" />
            </div>
          </div>

          {/* Last 7 avg */}
          {stats.gamesPlayed >= 7 && (
            <div className="stats-tile">
              <span className="stats-tile-value">{stats.avgScoreLast7}</span>
              <span className="stats-tile-label">Avg last 7 frames</span>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
