// Canonical lists of valid camera settings used throughout the game

export const SHUTTER_SPEEDS = [
  "1/8000", "1/4000", "1/2000", "1/1000", "1/500", "1/250",
  "1/125", "1/60", "1/30", "1/15", "1/8", "1/4", "1/2",
  "1s", "2s", "4s", "8s", "15s", "30s",
];

export const APERTURES = [
  "f/1", "f/1.1", "f/1.2", "f/1.4", "f/1.6", "f/1.8", "f/2", "f/2.2", "f/2.5", "f/2.8",
  "f/3.2", "f/3.5", "f/4", "f/4.5", "f/5", "f/5.6", "f/6.3", "f/7.1",
  "f/8", "f/9", "f/10", "f/11", "f/13", "f/14", "f/16", "f/18", "f/20", "f/22",
];

export const FOCAL_LENGTHS = [
  10, 12, 14, 16, 18, 20, 24, 28, 35, 40,
  50, 60, 70, 85, 105, 135, 175, 230, 300, 400,
];

// Convert shutter speed string to seconds for scoring
export function shutterToSeconds(s: string): number {
  if (s.includes("/")) {
    const [, denom] = s.split("/");
    return 1 / Number(denom);
  }
  return Number(s.replace("s", ""));
}

// Convert aperture string to f-number for scoring
export function apertureToNumber(a: string): number {
  return Number(a.replace("f/", ""));
}

// Distance in stops between two shutter speeds
export function shutterStopDistance(a: string, b: string): number {
  const sa = shutterToSeconds(a);
  const sb = shutterToSeconds(b);
  return Math.abs(Math.log2(sa) - Math.log2(sb));
}

// Distance in stops between two apertures (EV scale: f/N, stops = log2(b²/a²)/1 = 2*log2(b/a))
export function apertureStopDistance(a: string, b: string): number {
  const fa = apertureToNumber(a);
  const fb = apertureToNumber(b);
  return Math.abs(2 * Math.log2(fb / fa));
}

// Distance in stops between two focal lengths (1 stop = doubling)
export function focalStopDistance(a: number, b: number): number {
  return Math.abs(Math.log2(b / a));
}

export type FeedbackColor = "green" | "yellow" | "red";

export function stopsFeedback(stops: number): FeedbackColor {
  if (stops === 0) return "green";
  if (stops <= 1) return "yellow";
  return "red";
}
