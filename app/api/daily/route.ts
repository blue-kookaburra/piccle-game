import { NextResponse } from "next/server";
import { getTestChallenge } from "@/lib/test-data";

// Returns today's image + challenge number — NO EXIF data.
// EXIF is only returned by /api/submit on completion.
export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  // If no Supabase is configured, use test data
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const test = getTestChallenge(today);
    if (!test) return NextResponse.json({ error: "No challenge today" }, { status: 404 });
    return NextResponse.json({
      imageUrl: test.imageUrl,
      challengeNumber: test.challengeNumber,
      challengeDate: test.challengeDate,
      camera: test.camera,
      iso: test.iso,
      photographer: test.photographer,
      description: test.description,
      credit: test.credit,
    });
  }

  // Supabase path
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_challenges")
    .select("id, date, image_id, images(id, storage_url, description, credit, camera, iso, photographer)")
    .eq("date", today)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No challenge today" }, { status: 404 });
  }

  const image = (Array.isArray(data.images) ? data.images[0] : data.images) as {
    id: string;
    storage_url: string;
    description: string;
    credit: string;
    camera?: string;
    iso?: number;
    photographer?: string;
  } | null;

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Count past challenges to determine challenge number
  const { count } = await supabase
    .from("daily_challenges")
    .select("*", { count: "exact", head: true })
    .lte("date", today);

  return NextResponse.json({
    imageUrl: image.storage_url,
    challengeNumber: count ?? 1,
    challengeDate: today,
    camera: image.camera,
    iso: image.iso,
    photographer: image.photographer,
    description: image.description,
    credit: image.credit,
  });
}
