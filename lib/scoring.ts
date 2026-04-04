import {
  SHUTTER_SPEEDS,
  APERTURES,
  FOCAL_LENGTHS,
  type FeedbackColor,
} from "./camera-values";

export type { FeedbackColor };

export interface AttemptFeedback {
  shutter: FeedbackColor;
  aperture: FeedbackColor;
  focal: FeedbackColor;
  points: number;
  isCorrect: boolean;
}

// Max points available per attempt (round 1 is always the best round to score)
const MAX_POINTS_PER_ATTEMPT = [1000, 500, 250, 125, 60];

// Green = 1/3 of round pool; yellow = 10% of pool; red = 0
function settingPoints(maxForAttempt: number, color: FeedbackColor): number {
  if (color === "green") return maxForAttempt / 3;
  if (color === "yellow") return maxForAttempt * 0.10;
  return 0;
}

function colorRank(c: FeedbackColor): number {
  return c === "green" ? 2 : c === "yellow" ? 1 : 0;
}

// Points are only earned when a setting strictly improves vs its best previous colour.
// Round 1 (previousBest = undefined) always scores normally.
function earnedPts(maxPts: number, color: FeedbackColor, prevColor: FeedbackColor | undefined): number {
  if (prevColor === undefined) return settingPoints(maxPts, color);
  if (colorRank(color) > colorRank(prevColor)) return settingPoints(maxPts, color);
  return 0;
}

// Distance in array positions ("clicks") between two values
function clickDistance(arr: readonly (string | number)[], a: string | number, b: string | number): number {
  const ai = (arr as (string | number)[]).indexOf(a);
  const bi = (arr as (string | number)[]).indexOf(b);
  if (ai === -1 || bi === -1) return 99;
  return Math.abs(ai - bi);
}

// Green = exact; yellow = within 2 clicks; red = 3+ clicks away
function clickFeedback(clicks: number): FeedbackColor {
  if (clicks === 0) return "green";
  if (clicks <= 2)  return "yellow";
  return "red";
}

type PreviousBest = { shutter: FeedbackColor; aperture: FeedbackColor; focal: FeedbackColor };

export function scoreAttempt(
  attempt: { shutter: string; aperture: string; focal: number },
  answer:  { shutter: string; aperture: string; focal: number },
  attemptNumber: number, // 1-indexed
  previousBest?: PreviousBest
): AttemptFeedback {
  const shutterColor  = clickFeedback(clickDistance(SHUTTER_SPEEDS, attempt.shutter,  answer.shutter));
  const apertureColor = clickFeedback(clickDistance(APERTURES,      attempt.aperture, answer.aperture));
  const focalColor    = clickFeedback(clickDistance(FOCAL_LENGTHS,   attempt.focal,    answer.focal));

  const isCorrect =
    shutterColor  === "green" &&
    apertureColor === "green" &&
    focalColor    === "green";

  const maxPts = MAX_POINTS_PER_ATTEMPT[Math.min(attemptNumber - 1, 4)];
  const points = Math.round(
    earnedPts(maxPts, shutterColor,  previousBest?.shutter) +
    earnedPts(maxPts, apertureColor, previousBest?.aperture) +
    earnedPts(maxPts, focalColor,    previousBest?.focal)
  );

  return { shutter: shutterColor, aperture: apertureColor, focal: focalColor, points, isCorrect };
}
