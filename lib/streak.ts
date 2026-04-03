export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
}

const KEY = "shutter-shaper-streak";

export function getStreak(): StreakState {
  if (typeof window === "undefined")
    return { currentStreak: 0, longestStreak: 0, lastPlayedDate: "" };
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: "",
    };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastPlayedDate: "" };
  }
}

export function updateStreak(completedDate: string): StreakState {
  const s = getStreak();

  // Already counted today
  if (s.lastPlayedDate === completedDate) return s;

  const yesterday = new Date(completedDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  const newStreak =
    s.lastPlayedDate === yStr ? s.currentStreak + 1 : 1;

  const updated: StreakState = {
    currentStreak: newStreak,
    longestStreak: Math.max(s.longestStreak, newStreak),
    lastPlayedDate: completedDate,
  };

  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
