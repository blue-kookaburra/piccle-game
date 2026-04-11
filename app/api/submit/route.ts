import { NextRequest, NextResponse } from "next/server";
import { scoreAttempt, type FeedbackColor } from "@/lib/scoring";
import { isRateLimited } from "@/lib/rate-limit";
import { getTestChallenge } from "@/lib/test-data";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";

const VALID_COLORS = new Set(["green", "yellow", "red"]);

// Compute which direction the player should move for each non-green setting
function computeDirection(
  guess: { shutter: string; aperture: string; focal: number },
  answer: { shutter: string; aperture: string; focal: number },
  feedback: { shutter: string; aperture: string; focal: string }
) {
  const shutterDir = feedback.shutter !== "green"
    ? (SHUTTER_SPEEDS.indexOf(guess.shutter) < SHUTTER_SPEEDS.indexOf(answer.shutter) ? "slower" : "faster")
    : null;
  const apertureDir = feedback.aperture !== "green"
    ? (APERTURES.indexOf(guess.aperture) < APERTURES.indexOf(answer.aperture) ? "narrower" : "wider")
    : null;
  const focalDir = feedback.focal !== "green"
    ? (FOCAL_LENGTHS.indexOf(guess.focal) < FOCAL_LENGTHS.indexOf(answer.focal) ? "longer" : "shorter")
    : null;
  return { shutter: shutterDir, aperture: apertureDir, focal: focalDir };
}

// Module-level cache — survives across requests on a warm serverless instance.
// Eliminates the Supabase round-trip on every shot after the first.
const answerCache = new Map<string, {
  answer: { shutter: string; aperture: string; focal: number };
  revealData: {
    description: string; credit: string;
    shutterOriginal?: string; apertureOriginal?: string; focalOriginal?: number;
    unsplashUrl?: string; comment?: string; completionLink?: string;
  };
}>();

interface SubmitBody {
  date: string;
  shutter: string;
  aperture: string;
  focal: number;
  attemptNumber: number;
  previousBestColors?: { shutter: string; aperture: string; focal: string };
  preview?: boolean;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
  if (isRateLimited(`submit:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body: SubmitBody = await req.json();
  const { date, shutter, aperture, focal, attemptNumber, previousBestColors, preview } = body;

  // --- Input validation ---
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!SHUTTER_SPEEDS.includes(shutter)) {
    return NextResponse.json({ error: "Invalid shutter speed" }, { status: 400 });
  }
  if (!APERTURES.includes(aperture)) {
    return NextResponse.json({ error: "Invalid aperture" }, { status: 400 });
  }
  if (!FOCAL_LENGTHS.includes(focal)) {
    return NextResponse.json({ error: "Invalid focal length" }, { status: 400 });
  }
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > 5) {
    return NextResponse.json({ error: "Invalid attempt number" }, { status: 400 });
  }
  if (previousBestColors !== undefined) {
    const { shutter: ps, aperture: pa, focal: pf } = previousBestColors;
    if (!VALID_COLORS.has(ps) || !VALID_COLORS.has(pa) || !VALID_COLORS.has(pf)) {
      return NextResponse.json({ error: "Invalid previousBestColors" }, { status: 400 });
    }
  }
  // --- End validation ---

  let answer: { shutter: string; aperture: string; focal: number } | null = null;
  let revealData: {
    description: string;
    credit: string;
    shutterOriginal?: string;
    apertureOriginal?: string;
    focalOriginal?: number;
    unsplashUrl?: string;
    comment?: string;
    completionLink?: string;
  } | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Check module-level cache first
    if (answerCache.has(date)) {
      const cached = answerCache.get(date)!;
      answer = cached.answer;
      revealData = cached.revealData;
    } else {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("daily_challenges")
        .select(`images(
          shutter_speed, aperture, focal_length,
          description, credit,
          camera, iso, photographer, location,
          shutter_speed_original, focal_length_original,
          unsplash_url, comment, completion_link
        )`)
        .eq("date", date)
        .single();

      if (!error && data?.images) {
        const img = (Array.isArray(data.images) ? data.images[0] : data.images) as {
          shutter_speed: string;
          aperture: string;
          focal_length: number;
          description: string;
          credit: string;
          shutter_speed_original?: string;
          focal_length_original?: number;
          unsplash_url?: string;
          comment?: string;
          completion_link?: string;
        };
        answer = { shutter: img.shutter_speed, aperture: img.aperture, focal: img.focal_length };
        revealData = {
          description: img.description,
          credit: img.credit,
          shutterOriginal: img.shutter_speed_original,
          focalOriginal: img.focal_length_original,
          unsplashUrl: img.unsplash_url,
          comment: img.comment,
          completionLink: img.completion_link,
        };
        answerCache.set(date, { answer, revealData });
      }
    }
  }

  // Fall back to test data (no Supabase configured, or no challenge in DB for this date)
  if (!answer) {
    const test = getTestChallenge(date);
    if (!test) return NextResponse.json({ error: "No challenge for date" }, { status: 404 });
    answer = { shutter: test.shutter, aperture: test.aperture, focal: test.focal };
    revealData = {
      description: test.description,
      credit: test.credit,
      shutterOriginal: test.shutterOriginal,
      apertureOriginal: test.apertureOriginal,
      focalOriginal: test.focalOriginal,
      unsplashUrl: test.unsplashUrl,
    };
  }

  const feedback = scoreAttempt(
    { shutter, aperture, focal },
    answer,
    attemptNumber,
    previousBestColors as { shutter: FeedbackColor; aperture: FeedbackColor; focal: FeedbackColor } | undefined
  );

  const isLastAttempt = attemptNumber >= 5;
  const shouldReveal = feedback.isCorrect || isLastAttempt;

  // Increment daily_stats in Supabase (if connected) when game ends
  let solveRate: number | undefined;
  if (shouldReveal && !preview && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      await supabase.rpc("increment_daily_stats", {
        p_date: date,
        p_solved: feedback.isCorrect ? 1 : 0,
      });

      const { data: statsRow } = await supabase
        .from("daily_stats")
        .select("total_plays, total_solves")
        .eq("date", date)
        .single();

      if (statsRow && statsRow.total_plays > 0) {
        solveRate = Math.round((statsRow.total_solves / statsRow.total_plays) * 100);
      }
    } catch {
      // Non-critical — don't fail the request
    }
  }

  const direction = computeDirection({ shutter, aperture, focal }, answer, feedback);

  return NextResponse.json({
    feedback,
    direction,
    ...(shouldReveal && {
      answer,
      ...revealData,
      ...(solveRate !== undefined && { solveRate }),
    }),
  });
}
