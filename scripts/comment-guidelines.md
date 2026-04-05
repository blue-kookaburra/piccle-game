# PICCLE Image Comment Style Guidelines

These guidelines are used to generate completion-screen comments for PICCLE — a daily photography guessing game. Players see a photo and guess its camera settings. The comment appears after the game ends and explains the settings in the context of the image.

---

## Voice

- Warm, curious, engaged — like a photographer friend explaining their shot over coffee
- First-person allowed but used sparingly ("I love...", "makes me wonder...")
- Never dry, never clinical, never bullet-pointy
- Parenthetical glossary for jargon — always explain "fast" and "slow" for aperture in brackets the first time: `"fast (low number) aperture"` or `"slow (high number) aperture"`
- Crop factor always noted in parentheses when sensor is not full-frame: `"about 130mm (full frame equivalent after applying 1.5× crop factor to 85mm)"`

---

## What to always include

- The **why** behind each setting — what the photographer was trying to achieve, not just the number
- The **emotional or visual feel** that the settings serve (bokeh, sharpness, freezing motion, light gathering, compression)
- The **image itself** — bring the subject/scene into the technical explanation
- End on the image, not the numbers

---

## Structural templates (vary between these)

### 1. Emotional hook → settings
Open with what the image makes you feel or notice, then explain each setting in service of that feeling.
> "What is she dreaming of? Her slightly open mouth makes me wonder..."

### 2. Lead with the surprising setting
When a setting is counterintuitive or unexpected, lead with it to create intrigue.
> "Shutter speed is deceptively fast — 1/200s — to capture this action-filled scene..."

### 3. Debunk the apparent clue
Point out a visual cue that misleads, then reveal the truth.
> "The blurry plants in front of her face might make you think it's a fast (low number) aperture, but at 105mm, there are actually a surprising amount of plants in focus..."

### 4. Causal chain
Show how one setting constrains or enables another.
> "...this relatively slow aperture means we have to compensate with a 1/8s shutter speed (not a big deal in a static scene where the photographer almost certainly has a tripod)..."

### 5. Photographer speculation
Infer what the photographer was thinking or doing from the EXIF evidence.
> "It also appears the photographer is using external lighting — the subject looks too brightly illuminated for a sky where the sun is behind the truck..."

### 6. Game difficulty woven in
Note which setting was hard to guess and why, so the player doesn't feel cheated.
> "Admittedly this is a hard one to nail the aperture — the key giveaways (bokeh and focal planes) are obscured by the motion of the image..."

---

## Focal length framing

| Range | How to describe |
|---|---|
| ≤24mm | "wide angle", "gets everything in frame", "makes the space breathe" |
| 28–50mm | "normal" or "human perspective", "what you'd see with your own eyes" |
| 50–85mm | "flattering", "slightly compressed", "brings you closer without distorting" |
| 85–135mm | "portrait reach", "starting to compress the scene" |
| 135–300mm | "telephoto compression", "isolates the subject" |
| 300mm+ | "long lens", "extreme compression", elements "pushed together in a crowd" |

---

## Aperture framing

- f/1–f/2.8: "fast (low number) aperture", "wide open", "melts the background", "light gatherer"
- f/4–f/5.6: "mid aperture", "some separation from background"
- f/8–f/11: "stopped down", "natural-looking sharpness across the scene", "corner-to-corner sharpness"
- f/16+: "very narrow aperture", "deep focus", "needs longer exposure to compensate"

---

## Shutter speed framing

- 1/8000–1/1000: "freezes the moment", "stops motion completely"
- 1/500–1/250: "fast enough to freeze most movement", "everyday action"
- 1/125–1/60: "borderline — very still subjects or wide lenses only"
- 1/30–1/8: "slow — risk of hand-shake, tripod likely"
- 1/4s+: "long exposure", "almost certainly on a tripod"

---

## ISO notes (include when interesting)

- ISO 100–400: "clean and grain-free", "good light"
- ISO 800–3200: "some grain to be expected", "pushing into lower light"
- ISO 6400+: "high ISO — real grain/noise tradeoff", "very low light"

---

## Format rules

- **4 sentences** — no more, no less. This is a hard limit.
- Do NOT start with "I"
- Do NOT use the word "perfect"
- Do NOT use bullet points or line breaks in the comment itself
- Use raw EXIF values (e.g. "1/200s") alongside snapped game values where they differ, explaining the snap: "1/200s — snapped to 1/250s in the game"
- If crop factor applies, always write the full-frame equivalent as: "about Xmm (full frame equivalent after applying Yx crop factor to Zmm)"
- Round full-frame equivalents to the nearest sensible number — nearest 5mm for lengths above 50mm, nearest 2mm below. Write "105mm" not "103.9mm"
- Round all focal lengths in prose to clean numbers. Never write raw decimal EXIF values like "103.9mm" or "16.0mm" — always round before writing

---

## What to avoid (learned from real edits)

### Never open with "There's something [adjective] about..."
This is the most common AI-generated opener. It is bland and formulaic. Every single comment must start differently. Examples of strong openers:
- "The 105mm focal length pulls distant rows of terraces tight against each other..." (start with the most interesting technical fact)
- "The quiet happiness of that dog is palpable." (start with the image's emotional core, briefly)
- "An absolutely stunning portrait of a heron caught in a private moment of preening..." (start with the scene itself)
- "This thrilling photo makes you *feel* energy rather than just see it..." (start with the player's experience)

### Cut all closing flourishes
Never end with reflective meta-commentary. These always get cut:
- "What stays with me is..."
- "It's the kind of image/photo that..."
- "Everything here conspires to..."
- "I love how the settings are..."
- "...because honestly, no one on earth..."

End on the image or the last technical point. A clean factual exit is better than a poetic sign-off.

### No camera model names in prose
Do not mention camera model names (e.g. "Canon EOS R6m2", "Nikon D610") in the comment body. The camera is context for the AI, not something to narrate.

### No meta-commentary
Do not reference the game, the player, or the generation process:
- "as the photographer points out" — there is no such source
- "I love how the settings are invisible in their restraint" — too self-aware
- "the key giveaways... are obscured" — fine only for game-difficulty notes

### No special characters that break CSV
Only use plain ASCII punctuation. Avoid:
- Em dash `—` → use ` - ` (space-hyphen-space) or rewrite with parentheses `()`
- Multiplication sign `x` must be a plain lowercase letter `x`, not the Unicode `x` symbol
- Smart quotes are fine; curly apostrophes are fine; but nothing above ASCII 127 except those
