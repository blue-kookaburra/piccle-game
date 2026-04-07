import { NextRequest, NextResponse } from "next/server";

// Failed attempt tracker — same in-memory approach as the upload route.
// Resets on cold start, which is acceptable for low-traffic admin access.
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILURES = 5;
const LOCKOUT_MS   = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();

  // Check lockout
  const record = failedAttempts.get(ip);
  if (record && record.lockedUntil > now) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { password } = await req.json();

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    const current = record ?? { count: 0, lockedUntil: 0 };
    const newCount = current.count + 1;
    failedAttempts.set(ip, {
      count: newCount,
      lockedUntil: newCount >= MAX_FAILURES ? now + LOCKOUT_MS : 0,
    });
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Success — clear any failure record
  failedAttempts.delete(ip);
  return NextResponse.json({ ok: true });
}
