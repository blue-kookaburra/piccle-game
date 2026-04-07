/** Canonical feedback colours — green/yellow/red — used in dials, attempt history, and share card. */
export const FEEDBACK_COLORS = {
  green:  "#22ff88",
  yellow: "#ffb800",
  red:    "#ff4d5a",
} as const;

export type FeedbackColorHex = typeof FEEDBACK_COLORS[keyof typeof FEEDBACK_COLORS];
