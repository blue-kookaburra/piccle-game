import type { AttemptFeedback } from "./scoring";

export interface Attempt {
  shutter: string;
  aperture: string;
  focal: number;
  feedback: AttemptFeedback;
}

export interface DailyGameState {
  date: string;
  attempts: Attempt[];
  completed: boolean;
  score: number;
}

const KEY = "shutter-shaper-game";

function load(): Record<string, DailyGameState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(all: Record<string, DailyGameState>) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getGameState(date: string): DailyGameState {
  const all = load();
  return (
    all[date] ?? { date, attempts: [], completed: false, score: 0 }
  );
}

export function saveGameState(state: DailyGameState) {
  const all = load();
  all[state.date] = state;
  save(all);
}
