import {
  shutterStopDistance,
  apertureStopDistance,
  focalStopDistance,
  stopsFeedback,
  type FeedbackColor,
} from "./camera-values";

export interface AttemptFeedback {
  shutter: FeedbackColor;
  aperture: FeedbackColor;
  focal: FeedbackColor;
  points: number;
  isCorrect: boolean;
}

// Max points per attempt: halves each round, Swedish rounding on final total
// Round 5 = round(125 / 2) = 63
const MAX_POINTS_PER_ATTEMPT = [1000, 500, 250, 125, 63];

// Green = 33.3% of round max; yellow = 20% of round max; red = 0
function settingPoints(maxForAttempt: number, color: FeedbackColor): number {
  if (color === "green") return maxForAttempt / 3;
  if (color === "yellow") return maxForAttempt * 0.20;
  return 0;
}

export function scoreAttempt(
  attempt: { shutter: string; aperture: string; focal: number },
  answer: { shutter: string; aperture: string; focal: number },
  attemptNumber: number // 1-indexed
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
    settingPoints(maxPts, shutterColor) +
      settingPoints(maxPts, apertureColor) +
      settingPoints(maxPts, focalColor)
  );

  return {
    shutter: shutterColor,
    aperture: apertureColor,
    focal: focalColor,
    points,
    isCorrect,
  };
}
