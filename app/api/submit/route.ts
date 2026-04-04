import { NextRequest, NextResponse } from "next/server";
import { scoreAttempt, type FeedbackColor } from "@/lib/scoring";
import { getTestChallenge } from "@/lib/test-data";

interface SubmitBody {
  date: string;
  shutter: string;
  aperture: string;
  focal: number;
  attemptNumber: number;
  previousBestColors?: { shutter: string; aperture: string; focal: string };
}

export async function POST(req: NextRequest) {
  const body: SubmitBody = await req.json();
  const { date, shutter, aperture, focal, attemptNumber, previousBestColors } = body;

  let answer: { shutter: string; aperture: string; focal: number } | null = null;
  let revealData: {
    description: string;
    credit: string;
    shutterOriginal?: string;
    apertureOriginal?: string;
    focalOriginal?: number;
    unsplashUrl?: string;
  } | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Supabase path — try to load from DB, fall back to test data if not found
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("daily_challenges")
      .select(`images(
        shutter_speed, aperture, focal_length,
        description, credit,
        camera, iso, photographer, location,
        shutter_speed_original, focal_length_original
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
      };
      answer = { shutter: img.shutter_speed, aperture: img.aperture, focal: img.focal_length };
      revealData = {
        description: img.description,
        credit: img.credit,
        shutterOriginal: img.shutter_speed_original,
        focalOriginal: img.focal_length_original,
      };
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
  if (shouldReveal && process.env.NEXT_PUBLIC_SUPABASE_URL) {
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

  return NextResponse.json({
    feedback,
    ...(shouldReveal && {
      answer,
      ...revealData,
      ...(solveRate !== undefined && { solveRate }),
    }),
  });
}
