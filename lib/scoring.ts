import {
  shutterStopDistance,
  apertureStopDistance,
  focalStopDistance,
  stopsFeedback,
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

// Max points per attempt: halves each round
const MAX_POINTS_PER_ATTEMPT = [1000, 500, 250, 125, 63];

// Green = 33.3% of round max; yellow = 10% of round max; red = 0
function settingPoints(maxForAttempt: number, color: FeedbackColor): number {
  if (color === "green") return maxForAttempt / 3;
  if (color === "yellow") return maxForAttempt * 0.10;
  return 0;
}

function colorRank(c: FeedbackColor): number {
  return c === "green" ? 2 : c === "yellow" ? 1 : 0;
}

// Points for a single setting: round 1 scores normally; later rounds only score improvements
function earnedPts(maxPts: number, color: FeedbackColor, prevColor: FeedbackColor | undefined): number {
  if (prevColor === undefined) return settingPoints(maxPts, color);
  if (colorRank(color) > colorRank(prevColor)) return settingPoints(maxPts, color);
  return 0;
}

type PreviousBest = { shutter: FeedbackColor; aperture: FeedbackColor; focal: FeedbackColor };

export function scoreAttempt(
  attempt: { shutter: string; aperture: string; focal: number },
  answer: { shutter: string; aperture: string; focal: number },
  attemptNumber: number, // 1-indexed
  previousBest?: PreviousBest
): AttemptFeedback {
  const shutterStops = shutterStopDistance(attempt.shutter, answer.shutter);
  const apertureStops = apertureStopDistance(attempt.aperture, answer.aperture);
  const focalStops = focalStopDistance(attempt.focal, answer.focal);

  const shutterColor = stopsFeedback(shutterStops);
  const apertureColor = stopsFeedback(apertureStops);
  const focalColor = stopsFeedback(focalStops);

  const isCorrect =
    shutterColor === "green" &&
    apertureColor === "green" &&
    focalColor === "green";

  const maxPts = MAX_POINTS_PER_ATTEMPT[Math.min(attemptNumber - 1, 4)];
  const points = Math.round(
    earnedPts(maxPts, shutterColor,  previousBest?.shutter) +
    earnedPts(maxPts, apertureColor, previousBest?.aperture) +
    earnedPts(maxPts, focalColor,    previousBest?.focal)
  );

  return {
    shutter: shutterColor,
    aperture: apertureColor,
    focal: focalColor,
    points,
    isCorrect,
  };
}
