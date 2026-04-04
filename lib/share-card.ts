import type { Attempt } from "./game-state";

interface ShareCardProps {
  attempts: Attempt[];
  score: number;
  challengeNumber: number;
  streak: number;
}

// Instagram Stories: 9:16
const W = 1080;
const H = 1920;
const MARGIN = 88;

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

// Feedback dot colors — no red on share card (ambiguous in feeds), wrong = dark
function feedbackDotColor(c: "green" | "yellow" | "red"): string {
  if (c === "green")  return CORRECT;
  if (c === "yellow") return CLOSE;
  return ZONE_3;
}

// 6-bladed aperture iris (the Piccle icon mark)
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

function divider(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = ZONE_3;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(W - MARGIN, y);
  ctx.stroke();
}

export async function generateShareCard(props: ShareCardProps): Promise<Blob> {
  const { attempts, score, challengeNumber, streak } = props;

  // Ensure web fonts are loaded before rendering
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────────────
  ctx.fillStyle = ZONE_0;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial vignette — darkens corners slightly
  const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.85);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Warm inner glow — slight lift at center
  const glow = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, W * 0.55);
  glow.addColorStop(0, "rgba(30,20,14,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Header — logo + wordmark ─────────────────────────────────────────
  const HEADER_CY = 196;
  const IRIS_R    = 28;
  const IRIS_CX   = MARGIN + IRIS_R;

  drawIrisMark(ctx, IRIS_CX, HEADER_CY, IRIS_R);

  ctx.font         = `900 56px 'Bodoni Moda', Georgia, serif`;
  ctx.letterSpacing = "4px";
  ctx.fillStyle    = HOT;
  ctx.textBaseline = "middle";
  ctx.textAlign    = "left";
  ctx.fillText("PICCLE", IRIS_CX + IRIS_R + 22, HEADER_CY);
  ctx.letterSpacing = "0px";

  divider(ctx, 248);

  // ── Frame number ─────────────────────────────────────────────────────
  ctx.font         = `700 22px 'Azeret Mono', 'Courier New', monospace`;
  ctx.letterSpacing = "3px";
  ctx.fillStyle    = GOLD;
  ctx.textBaseline = "middle";
  ctx.textAlign    = "left";
  ctx.fillText(`FRAME ${challengeNumber}`, MARGIN, 322);
  ctx.letterSpacing = "0px";

  // ── Attempt dot grid ─────────────────────────────────────────────────
  const DOT_R    = 20;
  const DOT_GAP  = 72;   // center-to-center horizontal
  const ROW_GAP  = 76;   // center-to-center vertical
  const DOTS_TOP = 440;
  const DOTS_CX  = W / 2;  // center the 3-dot group

  for (let row = 0; row < 5; row++) {
    const attempt = attempts[row];
    const rowY    = DOTS_TOP + row * ROW_GAP;

    for (let col = 0; col < 3; col++) {
      const cx = DOTS_CX + (col - 1) * DOT_GAP;
      ctx.beginPath();
      ctx.arc(cx, rowY, DOT_R, 0, Math.PI * 2);

      if (attempt) {
        const key = (["shutter", "aperture", "focal"] as const)[col];
        ctx.fillStyle = feedbackDotColor(attempt.feedback[key]);
        ctx.fill();
      } else {
        ctx.strokeStyle = ZONE_3;
        ctx.lineWidth   = 2.5;
        ctx.stroke();
      }
    }
  }

  divider(ctx, DOTS_TOP + 5 * ROW_GAP + 40);

  // ── Score ─────────────────────────────────────────────────────────────
  const SCORE_DIVIDER_Y = DOTS_TOP + 5 * ROW_GAP + 40;
  const SCORE_CY        = SCORE_DIVIDER_Y + 240;

  ctx.font         = `900 200px 'Bodoni Moda', Georgia, serif`;
  ctx.letterSpacing = "-2px";
  ctx.fillStyle    = HOT;
  ctx.textBaseline = "middle";
  ctx.textAlign    = "center";
  ctx.fillText(String(score), W / 2, SCORE_CY);
  ctx.letterSpacing = "0px";

  ctx.font         = `400 26px 'Azeret Mono', 'Courier New', monospace`;
  ctx.fillStyle    = ZONE_7;
  ctx.textBaseline = "middle";
  ctx.textAlign    = "center";
  ctx.fillText("/ 1000", W / 2, SCORE_CY + 128);

  // ── Streak ────────────────────────────────────────────────────────────
  if (streak > 0) {
    ctx.font         = `700 24px 'Azeret Mono', 'Courier New', monospace`;
    ctx.letterSpacing = "1px";
    ctx.fillStyle    = GOLD;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    const streakLabel = streak === 1 ? "1 frame" : `${streak} frames straight`;
    ctx.fillText(`🔥  ${streakLabel}`, W / 2, SCORE_CY + 204);
    ctx.letterSpacing = "0px";
  }

  // ── Footer divider ────────────────────────────────────────────────────
  const FOOTER_DIV_Y = H - 200;
  divider(ctx, FOOTER_DIV_Y);

  // ── Footer ────────────────────────────────────────────────────────────
  const FOOTER_Y = FOOTER_DIV_Y + 80;

  ctx.font         = `italic 400 22px 'Bodoni Moda', Georgia, serif`;
  ctx.fillStyle    = ZONE_7;
  ctx.textBaseline = "middle";
  ctx.textAlign    = "left";
  ctx.fillText("develop your eye", MARGIN, FOOTER_Y);

  ctx.font         = `400 20px 'Azeret Mono', 'Courier New', monospace`;
  ctx.letterSpacing = "1px";
  ctx.fillStyle    = ZONE_7;
  ctx.textAlign    = "right";
  ctx.fillText("piccle.app", W - MARGIN, FOOTER_Y);
  ctx.letterSpacing = "0px";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}
