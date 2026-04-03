import type { DailyGameState } from "./game-state";
import { getStreak } from "./streak";

const GAME_KEY = "shutter-shaper-game";

function loadAllGames(): DailyGameState[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(GAME_KEY) ?? "{}") as Record<string, DailyGameState>;
    return Object.values(raw).filter((g) => g.completed);
  } catch {
    return [];
  }
}

export interface SettingAccuracy {
  green: number;  // percentage 0–100
  yellow: number;
  red: number;
  total: number;
}

export interface PersonalStats {
  gamesPlayed: number;
  gamesSolved: number;
  solveRate: number;        // 0–100
  bestScore: number;
  avgScore: number;
  avgScoreLast7: number;
  currentStreak: number;
  longestStreak: number;
  shutter: SettingAccuracy;
  aperture: SettingAccuracy;
  focal: SettingAccuracy;
  insight: string;
}

function calcAccuracy(games: DailyGameState[], key: "shutter" | "aperture" | "focal"): SettingAccuracy {
  let green = 0, yellow = 0, red = 0;
  for (const g of games) {
    for (const a of g.attempts) {
      const c = a.feedback[key];
      if (c === "green") green++;
      else if (c === "yellow") yellow++;
      else red++;
    }
  }
  const total = green + yellow + red;
  if (total === 0) return { green: 0, yellow: 0, red: 0, total: 0 };
  return {
    green:  Math.round((green  / total) * 100),
    yellow: Math.round((yellow / total) * 100),
    red:    Math.round((red    / total) * 100),
    total,
  };
}

function buildInsight(shutter: SettingAccuracy, aperture: SettingAccuracy, focal: SettingAccuracy): string {
  if (shutter.total === 0) return "";

  const scores = [
    { name: "shutter", pct: shutter.green },
    { name: "aperture", pct: aperture.green },
    { name: "focal length", pct: focal.green },
  ];
  const best  = scores.reduce((a, b) => (b.pct > a.pct ? b : a));
  const worst = scores.reduce((a, b) => (b.pct < a.pct ? b : a));

  if (best.name === worst.name) return "You're consistent across all three settings.";
  if (best.pct - worst.pct < 10) return "Your accuracy is well-balanced across all three settings.";
  return `You nail ${best.name} but tend to miss ${worst.name}.`;
}

export function getPersonalStats(): PersonalStats | null {
  const games = loadAllGames();
  const streak = getStreak();

  if (games.length === 0) return null;

  const scores = games.map((g) => g.score);
  const solved = games.filter((g) => {
    // A game is "solved" if at least one attempt was all-green
    return g.attempts.some(
      (a) => a.feedback.shutter === "green" && a.feedback.aperture === "green" && a.feedback.focal === "green"
    );
  });

  const last7 = games.slice(-7);
  const avg7 = last7.length > 0 ? Math.round(last7.reduce((s, g) => s + g.score, 0) / last7.length) : 0;

  const shutter  = calcAccuracy(games, "shutter");
  const aperture = calcAccuracy(games, "aperture");
  const focal    = calcAccuracy(games, "focal");

  return {
    gamesPlayed: games.length,
    gamesSolved: solved.length,
    solveRate: Math.round((solved.length / games.length) * 100),
    bestScore: Math.max(...scores),
    avgScore: Math.round(scores.reduce((s, n) => s + n, 0) / scores.length),
    avgScoreLast7: avg7,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    shutter,
    aperture,
    focal,
    insight: buildInsight(shutter, aperture, focal),
  };
}
