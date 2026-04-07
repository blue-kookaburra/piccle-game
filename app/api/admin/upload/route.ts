import { NextRequest, NextResponse } from "next/server";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Simple in-memory rate limiter: track failed login attempts per IP.
// Resets on cold start — good enough for a low-traffic admin route.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  // Check rate limit before even reading the body
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (record && now < record.resetAt && record.count >= MAX_FAILURES) {
    return NextResponse.json({ error: "Too many failed attempts. Try again later." }, { status: 429 });
  }

  const formData = await req.formData();
  const password = formData.get("password") as string;

  if (password !== process.env.ADMIN_PASSWORD) {
    // Record failed attempt
    if (record && now < record.resetAt) {
      record.count += 1;
    } else {
      failedAttempts.set(ip, { count: 1, resetAt: now + LOCKOUT_MS });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Successful auth — clear any failure record
  failedAttempts.delete(ip);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const file         = formData.get("file") as File;
  const assign_date  = formData.get("assign_date") as string;

  // Game settings
  const shutter_speed          = formData.get("shutter_speed") as string;
  const aperture               = formData.get("aperture") as string;
  const focal_length           = Number(formData.get("focal_length"));
  const shutter_speed_original = (formData.get("shutter_speed_original") as string) || null;
  const focal_length_original  = formData.get("focal_length_original") ? Number(formData.get("focal_length_original")) : null;

  // Camera info
  const camera = (formData.get("camera") as string) || null;
  const iso    = formData.get("iso") ? Number(formData.get("iso")) : null;

  // Attribution
  const photographer   = (formData.get("photographer") as string)   || null;
  const credit         = (formData.get("credit") as string)         || null;
  const unsplash_url   = (formData.get("unsplash_url") as string)   || null;
  const completion_link = (formData.get("completion_link") as string) || null;

  // Editorial
  const description = (formData.get("description") as string) || null;
  const comment     = (formData.get("comment") as string)     || null;

  // Validate file type and size
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large. Maximum size is 20 MB." }, { status: 400 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Derive extension from MIME type, not filename
  const mimeToExt: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const ext = mimeToExt[file.type];
  const path = `images/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("shutter-shaper")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("shutter-shaper")
    .getPublicUrl(path);

  // Insert image record
  const { data: imageRow, error: insertError } = await supabase
    .from("images")
    .insert({
      storage_url: urlData.publicUrl,
      shutter_speed,
      aperture,
      focal_length,
      shutter_speed_original,
      focal_length_original,
      camera,
      iso,
      photographer,
      credit,
      unsplash_url,
      completion_link,
      description,
      comment,
    })
    .select("id")
    .single();

  if (insertError || !imageRow) {
    return NextResponse.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });
  }

  // Bump any challenges already scheduled for this date or later, then insert
  if (assign_date) {
    await supabase.rpc("bump_challenges_from", { p_date: assign_date });
  }

  const { error: scheduleError } = await supabase
    .from("daily_challenges")
    .insert({ date: assign_date, image_id: imageRow.id });

  if (scheduleError) {
    return NextResponse.json({ error: scheduleError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
