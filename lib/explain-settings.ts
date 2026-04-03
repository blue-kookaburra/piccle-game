import { shutterToSeconds, apertureToNumber } from "./camera-values";

// Returns a one-sentence explanation of why the correct settings make sense.
// If a manual description is provided, use that instead.
export function explainSettings(
  shutter: string,
  aperture: string,
  focal: number,
  description?: string
): string {
  if (description && description.trim().length > 0) return description;

  const ss = shutterToSeconds(shutter);   // seconds
  const fn = apertureToNumber(aperture);  // f-number

  const isFast    = ss <= 1 / 500;
  const isSlow    = ss >= 1 / 30;
  const isWide    = fn <= 2.8;
  const isNarrow  = fn >= 8;
  const isTele    = focal >= 85;
  const isWideAng = focal <= 24;

  // Portrait: telephoto + wide aperture
  if (isTele && isWide) {
    return "Portrait combination — telephoto compression with a wide aperture to melt the background.";
  }

  // Landscape: wide angle + narrow aperture for deep focus
  if (isWideAng && isNarrow) {
    return "Wide angle with a small aperture for maximum depth of field throughout the scene.";
  }

  // Action / sports: fast shutter
  if (isFast && isWide) {
    return "Fast shutter to freeze motion, wide aperture to compensate in the available light.";
  }

  if (isFast) {
    return "Fast shutter speed to freeze motion — likely a bright scene or moving subject.";
  }

  // Long exposure risk: slow shutter on telephoto
  if (isSlow && isTele) {
    return "Slow shutter at this focal length risks camera shake — a tripod was almost certainly used.";
  }

  // Low light: slow shutter + wide aperture
  if (isSlow && isWide) {
    return "Slow shutter combined with a wide aperture — a low-light scene gathered over time.";
  }

  // Stopped-down telephoto: landscapes, architecture
  if (isTele && isNarrow) {
    return "Long focal length stopped down — sharp detail across a compressed, distant scene.";
  }

  // Wide angle action
  if (isWideAng && isFast) {
    return "Wide angle and fast shutter — close-quarters action with everything in frame.";
  }

  // Generic fallback
  return `${shutter} at ${aperture} — a balanced exposure for the light and depth of field in this scene.`;
}
