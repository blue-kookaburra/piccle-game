# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Token efficiency rules

These apply to every task in this project:

- **Read only what you need.** Before reading a file, state which specific section you need. Use `offset`+`limit` on large files instead of reading the whole thing.
- **Edit, don't rewrite.** Use `Edit` for targeted changes. Only use `Write` for new files or complete rewrites explicitly requested.
- **Parallelise independent work.** File reads, type checks, and unrelated edits can all run in the same message.
- **Run `npx tsc --noEmit` before `npm run build`.** Type errors surface faster and cheaper than a full build.
- **Don't read files you already know.** If a file was read earlier in the session, work from that knowledge unless you have a specific reason to re-read it.
- **No speculative exploration.** Don't read files "just in case" — only read what is necessary for the current task.
- **Skip summaries.** Don't restate what you just did; the diff speaks for itself.

## Commands

```bash
npm run dev          # local dev server at http://localhost:3000
npm run build        # production build (run before deploying)
npx tsc --noEmit     # type-check without building (run this first)
```

## What this is

PICCLE — a Wordle-style daily photography game. Players see a photo and guess the camera settings (shutter speed, aperture, focal length) used to take it. Up to 5 attempts. Built mobile-first, deployed on Vercel.

## Local testing (no Supabase needed)

Leave `NEXT_PUBLIC_SUPABASE_URL` blank in `.env.local`. Both API routes fall back to `lib/test-data.ts` — 3 hardcoded images that rotate by day-of-week. No database required.

**Important:** both `/api/daily` and `/api/submit` must implement the same fallback pattern: try Supabase first, then fall through to `getTestChallenge(date)` if no DB challenge exists. Keeping both in sync prevents "frame undefined" bugs on Vercel before challenges are scheduled.

## Architecture

| File | Role |
|------|------|
| `app/page.tsx` | Main game UI — all client state lives here |
| `app/api/daily/route.ts` | Returns today's image + challenge number, **never answer data** |
| `app/api/submit/route.ts` | Receives attempt + previous best colours; returns feedback + answer (on game end only) |
| `app/admin/page.tsx` | Password-protected image upload + scheduling |
| `lib/camera-values.ts` | Canonical arrays (`SHUTTER_SPEEDS`, `APERTURES`, `FOCAL_LENGTHS`) + log-stop distance functions |
| `lib/scoring.ts` | Scores each attempt: stop distance → green/yellow/red + improvement-based points |
| `lib/game-state.ts` | localStorage persistence for daily attempt history |
| `lib/streak.ts` | localStorage persistence for streak state |
| `lib/test-data.ts` | Fallback challenge data (rotates by day, no DB needed) |
| `components/PiccleLogo.tsx` | Inline SVG logo — color via CSS `color: var(--hot-pixel)` |
| `components/CameraBody.tsx` | Three half-dial pickers + SHOOT button |
| `components/AttemptHistory.tsx` | Attempt rows with green/yellow/red dots |
| `components/ImageViewer.tsx` | Daily photo display |
| `components/ResultCard.tsx` | End-of-game score + share card |

## Camera values

```
SHUTTER_SPEEDS: 20 values, "1/8000" → "60s" (1-stop increments, even count)
APERTURES:      28 values, "f/1" → "f/22" (1/3-stop increments)
FOCAL_LENGTHS:  20 values, 10mm → 400mm
```

Dial tick marks:
- **Shutter / Focal**: `majorEvery={2}` — alternating major/minor
- **Aperture**: `majorEvery={3}` — major tick every 3rd value = full stop

## Scoring system

**Colour thresholds** (logarithmic stop distance):
- `green` = exact (0 stops)
- `yellow` = ≤1 stop away
- `red` = >1 stop away

**Points — improvement-only rule:**
- Round 1: all three settings score normally
- Round 2+: a setting only earns points if its colour is **strictly better** than the best colour achieved for that setting in any previous round (red < yellow < green)
- Same colour or worse = 0 pts for that setting

Max per-setting pool per round: 1000 / 500 / 250 / 125 / 63 (halving). Green = pool/3, yellow = pool×0.10, red = 0.

`previousBestColors` is computed client-side in `page.tsx` and sent with every submit request so the server can apply the improvement rule.

## Design system

CSS custom properties (defined in `app/globals.css`):

```
Zone scale (dark → light):
  --zone-0: #0c0a09   --zone-1: #161210   --zone-2: #1e1a17
  --zone-3: #2a2520   --zone-4: #3a322c   --zone-5: #544940
  --zone-6: #6e5e54   --zone-7: #8c7e74   --zone-8: #b8a89e
  --zone-9: #f2ede7

  --hot-pixel: #ff4800   (orange accent — logo, indicators, fire button)
  --zone-mid:  #4a4040   (too dark for small text — avoid for labels)

Fonts:
  --font-display: Bodoni Moda 900 (wordmark, score numbers, italic captions)
  --font-mono:    Azeret Mono     (camera values, labels, attempt rows)
  --font-body:    DM Sans         (body copy)
```

**Legibility rule:** never use `var(--zone-mid)` on small text. Use `var(--zone-7)` minimum for secondary labels (dial labels, arrows, captions).

## Mobile / scroll behaviour

- `html` and `body`: `overflow: hidden` — prevents the page from scrolling
- `.game-layout`: `overflow-y: auto; overscroll-behavior-y: contain` — internal scroll container
- Image section uses `height: 54svh` (Small Viewport Height — does not change when browser chrome appears/disappears)
- Dial drag zones use `touch-action: pan-y` so vertical page scroll passes through while horizontal drag is captured by JS

## Interactive dials (CameraBody)

Each dial is a half-circle SVG with `viewBox="-59 -59 118 65"`. Interaction via Pointer Events:
- `setPointerCapture` on pointer down to track drag across the whole screen
- Accumulate horizontal delta; step value every 12px
- `touch-action: pan-y` on the drag zone div

Glow on SHOOT: `motion.circle` keyed with `${uid}-glow-${shotKey}` — `shotKey = attempts.length` ensures the animation re-triggers even for consecutive same-colour rounds.

## Supabase schema

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_url TEXT NOT NULL,
  shutter_speed TEXT NOT NULL,
  aperture TEXT NOT NULL,
  focal_length INTEGER NOT NULL,
  description TEXT,
  credit TEXT,
  camera TEXT,
  iso INTEGER,
  photographer TEXT,
  location TEXT,
  shutter_speed_original TEXT,
  focal_length_original INTEGER,
  active BOOLEAN DEFAULT true
);

CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  image_id UUID REFERENCES images(id)
);

CREATE TABLE daily_stats (
  date DATE PRIMARY KEY,
  total_plays INTEGER DEFAULT 0,
  total_solves INTEGER DEFAULT 0
);
```

Storage bucket: `shutter-shaper` (public read). Tables are publicly readable — EXIF data is protected by the API layer (never returned by `/api/daily`; only returned by `/api/submit` when the game ends).

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
