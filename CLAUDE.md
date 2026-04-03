# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # local dev server at http://localhost:3000
npm run build   # production build (run before deploying)
npx tsc --noEmit  # type-check without building
```

## What this is

ShutterShaper — a Wordle-style daily game where players guess camera settings (shutter speed, aperture, focal length) from a photo. Up to 5 attempts; score decreases with each attempt. Built for mobile-first use on Vercel.

## Local testing (no Supabase needed)

Leave `NEXT_PUBLIC_SUPABASE_URL` blank in `.env.local`. The app falls back to `lib/test-data.ts` — 3 hardcoded Unsplash images that rotate by day. No database required.

## Architecture

- `app/page.tsx` — main game UI (client component, all state lives here)
- `app/api/daily/route.ts` — returns today's image + challenge number, **never EXIF**
- `app/api/submit/route.ts` — receives attempt, returns score/feedback; reveals EXIF only when game ends
- `app/admin/page.tsx` — password-protected image upload + scheduling UI
- `lib/camera-values.ts` — canonical shutter/aperture/focal arrays + log-stop distance functions
- `lib/scoring.ts` — scores each attempt using logarithmic stop distance (green/yellow/red)
- `lib/game-state.ts` + `lib/streak.ts` — localStorage persistence (no account needed at launch)
- `components/CameraBody.tsx` — SVG top-down camera illustration with animated rings
- `components/DialPicker.tsx` — shared ‹ value › control used for each camera setting

## Scoring

Each setting scored in log stops: 0 = green (100%), ≤1 stop = yellow (50%), >1 stop = red (0%).
Max points per attempt: 1000, 833, 667, 500, 333 (attempt 1–5).
Each of the 3 settings contributes 1/3 of the attempt's max.

## Supabase schema (when ready to connect)

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_url TEXT NOT NULL,
  shutter_speed TEXT NOT NULL,
  aperture TEXT NOT NULL,
  focal_length INTEGER NOT NULL,
  description TEXT,
  credit TEXT,
  active BOOLEAN DEFAULT true
);

CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  image_id UUID REFERENCES images(id)
);
```

Storage bucket: `shutter-shaper` (public read).
Both tables should be publicly readable (no sensitive data — EXIF is protected by the API layer, not RLS).

## Adding Supabase

1. Create project at supabase.com
2. Run the SQL above in the SQL editor
3. Create a storage bucket named `shutter-shaper` with public access
4. Fill in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
   ADMIN_PASSWORD=your-secret
   ```
5. Use `/admin` to upload images and schedule daily challenges
