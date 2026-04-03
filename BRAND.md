# PICCLE — Brand Identity

> **"Develop your eye."**

---

## 1. What Is Piccle?

Piccle is a daily photography puzzle. One photograph. Three numbers — shutter speed, aperture, focal length. Five shots to get it right. Your score drops with each attempt.

It is the game for people who *see* — who have stood behind a lens long enough to feel in their chest why a photo worked. It tests not trivia but intuition: what was the photographer doing when they made this image?

Piccle is not about learning photography. It is about confirming what you already know, then pushing further.

---

## 2. Name

**PICCLE** — from *pic* (picture) + the diminutive suffix *-cle* (from Latin, like *particle*, *article*, *spectacle*).

A small picture puzzle. Compressed, memorable, phonetically crisp: **PIK-ul**.

The double-C is intentional — when typeset tightly in the wordmark, the adjacent C forms suggest an aperture iris. Not a literal icon. A hidden mark within the letters.

---

## 3. Tagline

> **Develop your eye.**

Two readings, one phrase:
- *Develop* as in darkroom chemistry — the slow reveal of what's latent in the image
- *Eye* as in photographic vision — the skill of reading light, composition, moment

It is aspirational without being aggressive. It implies that playing Piccle is itself the act of developing a skill. Not a boast, a promise.

**Secondary line** (used in App Store descriptions, press, sharing contexts):
> *One photo. Three numbers. Every day.*

---

## 4. Brand Personality

Piccle speaks like a knowledgeable friend at a photobook fair — confident, specific, never condescending. It assumes you know what f/2.8 means. It does not explain aperture. It respects the player's intelligence absolutely.

| Attribute | Expression |
|---|---|
| Precise | Uses actual photographic vocabulary without quotes around it |
| Warm | The game feels like a ritual, not a test |
| Dry | Feedback is short, understated, earned |
| Grounded | No gamification bloat — no confetti, no "Amazing!!!" |

**What Piccle is not:**
- Not a photography tutorial
- Not pretentious (it's not Leica — it's for everyone who cares)
- Not childish (no mascots, no bouncing UI, no hyperactive copy)
- Not a social media dopamine machine (though it should spread organically through quality)

---

## 5. Color System — "The Zone"

Ansel Adams developed the Zone System to organize photographic tonality into ten zones from pure black to paper white. Piccle uses this as its design spine: a warm near-monochrome scale, controlled by one high-energy signature accent.

### Zone Scale

```css
--zone-0:   #0c0a09;   /* Darkroom black        — page background */
--zone-1:   #161210;   /* Camera body           — card/panel backgrounds */
--zone-2:   #1f1b18;   /* Viewfinder housing    — elevated surfaces */
--zone-3:   #2a2520;   /* Interactive surface   — hover, focus states */
--zone-mid: #4a4040;   /* Shadow grain          — disabled, muted text */
--zone-7:   #8c7e74;   /* Mid grain             — secondary text */
--zone-9:   #f2ede7;   /* Paper white           — primary text */
```

### Signature Color

```css
--hot-pixel: #ff4800;
```

**Hot Pixel** is the one vivid element in the entire system. It earns its saturation by standing completely alone against the warm-black zone scale.

Named after the overexposed pixels a digital sensor produces at extreme ISO — too much light hitting one point. In Piccle, every interactive element, every call to action, every brand moment is that single overexposed point: one bright spot in a composed frame.

**Why this color specifically:**
- Not owned by any major photography brand (Leica = red, Kodak = yellow, Nikon = yellow, Canon = red, Fujifilm = green stripe)
- The recording indicator on video cameras and cinema cameras is exactly this orange — there is photographic muscle memory here
- Film leader tape — the orange acetate at the start of a roll — is this color
- On the warm-black background, it reads at maximum contrast without the cold harshness of pure red or the genericness of amber

**Rules:**
- Hot Pixel is used for: the logo mark, primary action buttons ("Shoot"), interactive accents, score display
- Nothing else in the UI competes with Hot Pixel saturation
- On a white background (press assets, screenshots): use Hot Pixel unchanged

### Secondary Accents

```css
--film-gold:  #c8952a;   /* Scores, streaks — secondary warm accent */
--blueprint:  #2d7dd2;   /* Informational states — cyanotype reference */
```

Film Gold is the secondary accent. It appears on score numbers and streak counts — things that feel earned and accumulated, like old gold.

Blueprint Blue appears only for neutral informational states (tooltips, empty states, hint text). It references the cyanotype photographic process — one of the oldest, producing Prussian blue prints. It is cool and calm against the warm tones of everything else.

### Game Feedback Colors

```css
--correct: #27ae60;   /* Green channel — exact match (within 0 stops) */
--close:   #c8952a;   /* Film gold — within 1 stop (reuses --film-gold) */
--wrong:   #c0392b;   /* Overexposed red — off by more than 1 stop */
```

The feedback palette borrows from RGB sensor channels: green, yellow-gold, red. These are semantically universal but the specific shades are chosen to work on the dark background without feeling like traffic lights.

---

## 6. Typography

Three typefaces. Each has one job.

### Display — Bodoni Moda 900, ALL CAPS

```
PICCLE
FRAME 247
DEVELOPED.
750 / 1000
```

Used for: the logo/wordmark, section headers, score display, any text that must stop the eye.

**Always all-caps. Always. No exceptions.**

Letter-spacing: `0.08em`. This gives it the air of a magazine masthead.

Bodoni Moda is the typeface of *Aperture* magazine, *Vogue*, *Harper's Bazaar*, *Foam*. It is the editorial world in which photographs are taken seriously. Its extreme contrast between thick strokes and hairline serifs creates visual tension that photographs naturally amplify.

"PICCLE" in Bodoni Moda 900 does not look like an app name. It looks like a masthead. That is the intent: Piccle is a daily publication, not a product. A ritual, not a feature.

Available free on Google Fonts as a variable font (axes: weight 400–900, optical size).

### Monospace — Azeret Mono 400 / 700

```
1/500   f/2.8   50mm
1/60    f/11    200mm
```

Used for: all camera settings values, the attempt history grid, any technical display of photographic data.

Azeret Mono is newer and more optically compensated than Space Mono or IBM Plex Mono. Its numerals read more like they are **printed on a camera body** than typed in a terminal — the spacing is slightly wider, the stroke weights more even. At 13–14px on mobile it is comfortably legible.

### Body — DM Sans 400 / 500

Used for: instructions, labels, tooltips, sub-headers, all narrative UI text.

DM Sans pairs cleanly with Bodoni Moda without competing. Its neutral, slightly rounded forms provide calm between the drama of the display face and the precision of the mono.

### Typography Rules

1. Bodoni Moda appears only in ALL CAPS, never mixed case
2. Minimum size for display face: 18px
3. Score numbers are the largest text element on the result screen
4. Camera values are always Azeret Mono — even in the attempt history grid
5. No decorative italics anywhere in the UI

---

## 7. Logo

### Wordmark

`PICCLE` — Bodoni Moda 900, all-caps, tracking +80 (0.08em), Hot Pixel on dark / on light background.

The adjacency of the two C characters creates a negative space that reads as an aperture opening at a glance. This is not called out anywhere in the UI — it is a reward for those who look closely.

### Icon Mark

A 6-bladed aperture iris SVG where the opening forms a perfect hexagon. Used as:
- App icon / favicon
- Share card watermark (small, bottom-right)
- Loading indicator (iris opens as a page load animation)

The icon is always Hot Pixel on dark background, or Hot Pixel on white for press use.

### Size & Clearspace

- Minimum wordmark width: 80px
- Minimum icon width: 24px
- Clearspace: 0.5× the cap height of the wordmark on all sides
- Never place the wordmark on a mid-tone background — only on Zone 0 or pure white

---

## 8. Motion Language

Every animation references camera mechanics. None of this is decorative — each motion reinforces that the player is in a photographic world.

| Moment | Animation | Spec |
|---|---|---|
| Page load | Aperture iris opens from center, blades rotate outward | 200ms, ease-out |
| Dial / knob turn | Overshoot + spring settle (mechanical resistance feel) | Spring: stiffness 200, damping 20 |
| Correct answer | Green pulse radiates from indicator dot, like a light burst | 300ms, scale 1→2, opacity 1→0 |
| Wrong answer | Single lateral shake, like a mis-focus jolt | 80ms, ±15px, 3 cycles |
| Score reveal | Numbers count up from 0; screen fades to "developed" state | 800ms count, 400ms fade |
| Share card generation | Appears as Polaroid developing — pale wash resolves to content | 600ms, white→image, ease-in |
| Streak increment | Flame shimmer — heat distortion on the 🔥 emoji | 400ms CSS thermal shimmer |

**Guiding principle:** Framer Motion for all React animations. CSS-only where the element is static (film grain overlay, hover states). `prefers-reduced-motion` respected on all transitions — no disorienting motion for users who need it off.

---

## 9. Voice & Copy

### Tone

Piccle speaks like a knowledgeable friend at a photo book fair. Short sentences. Understated reactions. Assumes photographic literacy.

It never says "Great job!" It says *"Sharp."*

### Feedback Language

| Situation | Piccle says |
|---|---|
| Correct (all three green) | **Sharp.** |
| Close (within 1 stop) | **One stop off.** |
| Wrong (> 1 stop) | **Blown out.** |
| All three correct on one attempt | **Nailed it.** |
| Game over — high score (700+) | **Developed.** |
| Game over — mid score (400–699) | **Exposed.** |
| Game over — low score (<400) | **Underexposed.** |
| New longest streak | **You're on a roll.** |
| First time playing | **First frame.** |

### In-game Language System

| Element | Old (ShutterShaper) | New (Piccle) |
|---|---|---|
| Game name | ShutterShaper | PICCLE |
| Daily challenge label | Challenge #247 | Frame 247 |
| Attempt counter | "5 attempts remaining" | "5 shots" / "4 shots left" |
| Submit button | FIRE | SHOOT |
| Score screen state | — | "Developed." |
| Post-game share | Share Result | Show your work |
| Streak display | 🔥 N-day streak | 🔥 N frames straight |

### Microcopy

- Empty attempt slots: `—` (em dash, not "empty" or a placeholder)
- Loading state: `developing...`
- Error state: `something didn't expose correctly.`
- Admin upload success: `frame queued.`

---

## 10. Share Card — "The Contact Sheet"

The contact sheet is the viral unit. Every share matters.

### Design

```
┌───────────────────────────────┐
│  ▣  PICCLE           Frame 247 │   ← Hot pixel iris mark + wordmark,
│                                │     Frame number right-aligned
├───────────────────────────────┤
│                                │
│   ■  ■  ■                     │   ← Attempt 1: green green green
│   ■  ■  ◐                     │   ← Attempt 2: green green gold
│   ■  ◐  ■                     │   ← Attempt 3: green gold green
│                                │
├───────────────────────────────┤
│                                │
│           750                  │   ← Score: Bodoni Moda 900,
│        / 1000                  │     Hot Pixel on dark bg
│                                │
│   🔥  5 frames straight        │   ← Streak, Film Gold color
│                                │
├───────────────────────────────┤
│   develop your eye   piccle.app│   ← Tagline muted, URL right-aligned
└───────────────────────────────┘
```

### Rules

**Background**: Zone 0 (`#0c0a09`) — dark. This is non-negotiable. A dark card looks premium in a screenshot on any feed. A white card disappears.

**Squares**: Use ■ green / ■ film-gold / ○ zone-2 (dark) — not bright yellow or red. Color-blind friendly, looks intentional, not like a stoplight.

**No spoilers**: The answer (actual shutter speed / aperture / focal length) is never shown on the share card. This is what protects the daily puzzle and invites others to try.

**Score is prominent**: The score is the largest element. This is the social proof driver and the FOMO mechanism. Seeing someone's "983/1000" on Twitter creates the desire to beat it.

**Generation method**: Client-side canvas render (html2canvas or similar), exported as PNG. The card should be exactly 1:1 (square) at 600×600px for cross-platform compatibility.

---

## 11. Application Checklist

When implementing this brand identity in the codebase:

1. **`app/globals.css`** — Replace all CSS custom properties with the Zone Scale + hot-pixel system above
2. **`app/layout.tsx`** — Update Google Font imports to: Bodoni Moda (axes: wght 400..900, opsz 6..96), Azeret Mono (400, 700), DM Sans (400, 500)
3. **`app/layout.tsx`** — Update `<title>` and `<meta description>` to Piccle branding and tagline
4. **`app/page.tsx`** — "ShutterShaper" → "PICCLE"; all copy updated per voice guide
5. **`components/ResultCard.tsx`** — New share card layout + copy + score display
6. **`components/AttemptHistory.tsx`** — Feedback dot colors → new palette; Azeret Mono for all values
7. **`components/camera/ShutterButton.tsx`** — "FIRE" → "SHOOT"
8. All feedback strings in scoring/game logic → updated per voice guide above

---

## 12. What to Avoid

- **Never** use Inter, Roboto, or system fonts anywhere in the UI
- **Never** use purple, teal, or neon gradients — these are the generic AI slop palette
- **Never** use mixed-case Bodoni Moda — display face is all-caps only
- **Never** put more than one vivid accent color on screen at once — Hot Pixel earns its intensity by being alone
- **Never** write feedback copy that could apply to any other game ("Amazing!", "You got it!", "So close!")
- **Never** show the answer on the share card
- **Never** add animations that can't be explained by a camera mechanic

---

*Piccle — develop your eye.*
