import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const password = formData.get("password") as string;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const file = formData.get("file") as File;
  const shutter_speed = formData.get("shutter_speed") as string;
  const aperture = formData.get("aperture") as string;
  const focal_length = Number(formData.get("focal_length"));
  const description = formData.get("description") as string;
  const credit = formData.get("credit") as string;
  const assign_date = formData.get("assign_date") as string;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() ?? "jpg";
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
      description,
      credit,
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
