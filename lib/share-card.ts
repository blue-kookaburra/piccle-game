import type { Attempt } from "./game-state";

interface ShareCardProps {
  attempts: Attempt[];
  score: number;
  challengeNumber: number;
  streak: number;
}

const W = 600;
const H = 600;

// Zone Scale palette
const ZONE_0   = "#0c0a09";
const ZONE_1   = "#161210";
const ZONE_3   = "#2a2520";
const ZONE_7   = "#8c7e74";
const ZONE_9   = "#f2ede7";
const HOT      = "#ff4800";
const GOLD     = "#c8952a";
const CORRECT  = "#27ae60";
const CLOSE    = "#c8952a";
const EMPTY    = "#1f1b18";

function loadFont(ctx: CanvasRenderingContext2D, family: string, size: number, weight = "900") {
  return `${weight} ${size}px ${family}`;
}

// Draw a filled hexagonal aperture iris mark
function drawIrisMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = HOT;
  ctx.fill();
}

// Map feedback color name to canvas fill color
function dotColor(c: "green" | "yellow" | "red" | "empty"): string {
  if (c === "green")  return CORRECT;
  if (c === "yellow") return CLOSE;
  if (c === "red")    return CLOSE;   // both close and wrong use gold on share card
  return EMPTY;
}

// Actual dot color per spec: green = correct, gold = close/wrong (no red — just 2 states)
function feedbackDotColor(c: "green" | "yellow" | "red"): string {
  if (c === "green") return CORRECT;
  if (c === "yellow") return CLOSE;
  return ZONE_3;   // wrong = dark empty-ish (no bright red on share card)
}

export async function generateShareCard(props: ShareCardProps): Promise<Blob> {
  const { attempts, score, challengeNumber, streak } = props;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────────
  ctx.fillStyle = ZONE_0;
  ctx.fillRect(0, 0, W, H);

  // Subtle warm vignette
  const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // ── Header row ──────────────────────────────────────────────────
  const headerY = 52;

  // Iris mark
  drawIrisMark(ctx, 44, headerY, 10);

  // PICCLE wordmark
  ctx.font = loadFont(ctx, "Georgia, serif", 28);
  ctx.fillStyle = HOT;
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "4px";
  ctx.fillText("PICCLE", 62, headerY);

  // Frame number — right-aligned
  ctx.font = `700 14px "Courier New", monospace`;
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText(`Frame ${challengeNumber}`, W - 40, headerY);
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";

  // Divider
  ctx.strokeStyle = ZONE_3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 76);
  ctx.lineTo(W - 40, 76);
  ctx.stroke();

  // ── Attempt dots ─────────────────────────────────────────────────
  const DOT_R = 11;
  const DOT_GAP = 32;
  const ROW_GAP = 34;
  const dotsStartY = 130;
  const dotsStartX = W / 2 - DOT_GAP;  // center 3 dots

  for (let i = 0; i < 5; i++) {
    const attempt = attempts[i];
    const rowY = dotsStartY + i * ROW_GAP;

    const settings = (["shutter", "aperture", "focal"] as const);
    for (let j = 0; j < 3; j++) {
      const cx = dotsStartX + j * DOT_GAP;
      const cy = rowY;

      ctx.beginPath();
      ctx.arc(cx, cy, DOT_R, 0, Math.PI * 2);

      if (attempt) {
        const color = feedbackDotColor(attempt.feedback[settings[j]]);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        // Empty slot — ring outline
        ctx.fillStyle = "transparent";
        ctx.strokeStyle = ZONE_3;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  // Divider
  const midDividerY = dotsStartY + 5 * ROW_GAP + 10;
  ctx.strokeStyle = ZONE_3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, midDividerY);
  ctx.lineTo(W - 40, midDividerY);
  ctx.stroke();

  // ── Score ────────────────────────────────────────────────────────
  const scoreY = midDividerY + 80;
  ctx.font = `900 88px Georgia, serif`;
  ctx.fillStyle = HOT;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(String(score), W / 2, scoreY);

  ctx.font = `400 18px "Courier New", monospace`;
  ctx.fillStyle = ZONE_7;
  ctx.textAlign = "center";
  ctx.fillText("/ 1000", W / 2, scoreY + 54);

  // ── Streak ──────────────────────────────────────────────────────
  if (streak > 0) {
    const streakY = scoreY + 96;
    ctx.font = `700 15px "Courier New", monospace`;
    ctx.fillStyle = GOLD;
    ctx.textAlign = "center";
    const streakLabel = streak === 1 ? "1 frame" : `${streak} frames straight`;
    ctx.fillText(`🔥  ${streakLabel}`, W / 2, streakY);
  }

  // Divider
  const bottomDivY = H - 64;
  ctx.strokeStyle = ZONE_3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, bottomDivY);
  ctx.lineTo(W - 40, bottomDivY);
  ctx.stroke();

  // ── Footer ──────────────────────────────────────────────────────
  const footerY = H - 36;
  ctx.font = `400 13px Georgia, serif`;
  ctx.fillStyle = ZONE_7;
  ctx.textAlign = "left";
  ctx.fillText("develop your eye", 40, footerY);

  ctx.font = `400 13px "Courier New", monospace`;
  ctx.fillStyle = ZONE_7;
  ctx.textAlign = "right";
  ctx.fillText("piccle.app", W - 40, footerY);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}
