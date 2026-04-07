// Fetches EXIF data from Unsplash API for a list of photo page URLs.
//
// Usage:
//   node scripts/fetch-exif.mjs YOUR_ACCESS_KEY [--input input.csv] [--output output.csv]
//
// Input CSV must have a column named "link" containing Unsplash page URLs:
//   https://unsplash.com/photos/some-description-AbCdEfGhI
//
// --input  defaults to scripts/links.csv
// --output defaults to scripts/output.csv
//          (if only --input is set, output is auto-named: links2.csv → output-links2.csv)

import { readFileSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";

const args = process.argv.slice(2);

function getFlag(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

const API_KEY    = args[0];
const INPUT_FILE = getFlag("--input") || "scripts/links.csv";

// Auto-derive output name from input: scripts/links2.csv → scripts/output-links2.csv
const defaultOutput = join(dirname(INPUT_FILE), "output-" + basename(INPUT_FILE));
const OUTPUT_FILE = getFlag("--output") || defaultOutput;

// ─── Load .env.local for ANTHROPIC_API_KEY ────────────────────────────────────
let ANTHROPIC_API_KEY = null;
try {
  const envLines = readFileSync(".env.local", "utf8").split("\n");
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("ANTHROPIC_API_KEY=")) {
      ANTHROPIC_API_KEY = trimmed.slice("ANTHROPIC_API_KEY=".length).trim();
      break;
    }
  }
} catch { /* .env.local missing — comments will be skipped */ }

if (!API_KEY) {
  console.error("Usage: node scripts/fetch-exif.mjs YOUR_ACCESS_KEY [--input input.csv] [--output output.csv]");
  process.exit(1);
}

// ─── Crop factor lookup ───────────────────────────────────────────────────────
// Returns the sensor crop factor for a given camera make/model.
// Full-frame cameras return 1.0 (no suffix added).
// Unknown cameras default to 1.0 — review the CSV and correct if needed.
function getCropFactor(make, model) {
  const s = `${make} ${model}`.toUpperCase();

  // Micro Four Thirds (2×) — check before generic Sony/Panasonic rules
  if (/OLYMPUS|OM SYSTEM|OM-\d|E-M\d|E-PL|PEN-F/.test(s)) return 2.0;
  if (/PANASONIC/.test(s) && /DMC-G|DMC-GH|DC-G|DC-GH|DC-GX|DC-G9|DC-S1/.test(s)) {
    // Panasonic S-series are full-frame; GH/GX/G-series are M4/3
    if (/DC-S/.test(s)) return 1.0;
    return 2.0;
  }

  // Sony APS-C (1.5×): ILCE-6xxx, ZV-E10, A5xxx, A6xxx
  if (/SONY/.test(s) && /ILCE-6|ILCE-5|ZV-E10|ZV-E1\b/.test(s)) return 1.5;

  // Nikon DX / APS-C (1.5×): Z30, Z50, Zfc, D3xxx/D5xxx/D7xxx bodies
  if (/NIKON/.test(s) && /\bZ\s*30\b|\bZ\s*50\b|\bZFC\b|D3\d{3}|D5\d{3}|D7\d{3}/.test(s)) return 1.5;

  // Fujifilm — almost all X-series are APS-C (1.5×); GFX is medium format (0.79×, leave as 1)
  if (/FUJI/.test(s) && !/GFX/.test(s)) return 1.5;

  // Canon APS-C (1.6×): EOS M-series, EOS R7/R10/R50, Rebel/xxxD, 7D, 90D
  if (/CANON/.test(s)) {
    if (/EOS M|EOS R7|EOS R10|EOS R50|REBEL|EOS \d{3}D|EOS \d{4}D|EOS [79]0D/.test(s)) return 1.6;
  }

  return 1.0; // full-frame or unknown — no crop note added
}

// Builds the display camera string, appending crop note when sensor isn't full-frame
function formatCamera(make, model) {
  const name = [make, model].filter(Boolean).join(" ");
  const crop = getCropFactor(make, model);
  if (crop === 1.0) return name;
  return `${name} (${crop}× crop)`;
}

// Valid focal lengths in the game — used to snap EXIF values to nearest option
const VALID_FOCAL_LENGTHS = [
  10, 12, 14, 16, 18, 20, 24, 28, 35, 40,
  50, 60, 70, 85, 105, 135, 175, 230, 300, 400,
];

// Canonical shutter speeds — keep in sync with lib/camera-values.ts
const SHUTTER_SPEEDS = [
  "1/8000","1/4000","1/2000","1/1000","1/500","1/250","1/125",
  "1/60","1/30","1/15","1/8","1/4","1/2","1s","2s","4s","8s","15s","30s","60s",
];

// Valid apertures in the game — used to snap EXIF values to nearest option
const VALID_APERTURES = [
  1.0, 1.1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8,
  3.2, 3.5, 4.0, 4.5, 5.0, 5.6, 6.3, 7.1,
  8.0, 9.0, 10, 11, 13, 14, 16, 18, 20, 22,
];

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(content) {
  const lines = content.trim().split("\n").map(l => l.trimEnd());
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = splitCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Field formatters ─────────────────────────────────────────────────────────

function extractPhotoId(pageUrl) {
  const slug = pageUrl.trim().split("/").pop();
  const parts = slug.split("-");
  return parts[parts.length - 1];
}

// Snaps an aperture f-number to the nearest valid game value
function snapAperture(aperture) {
  if (!aperture) return "";
  const n = parseFloat(aperture);
  if (isNaN(n)) return "";
  return VALID_APERTURES.reduce((best, curr) =>
    Math.abs(curr - n) < Math.abs(best - n) ? curr : best
  );
}

// Returns shutter speed as a human-readable string e.g. "1/500", "2s"
function formatShutter(exposureTime) {
  if (!exposureTime) return "";
  const s = String(exposureTime).trim();
  if (s.includes("/")) return s;           // already "1/500" — keep as-is
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  if (n >= 1) return `${n}s`;
  const denom = Math.round(1 / n);
  return `1/${denom}`;
}

// Converts a canonical shutter string ("1/250", "2s") to seconds
function shutterStrToSecs(str) {
  if (str.endsWith("s")) return parseFloat(str);
  if (str.startsWith("1/")) return 1 / parseFloat(str.slice(2));
  return parseFloat(str);
}

// Snaps raw Unsplash exposure_time to the nearest canonical shutter speed
function snapShutter(exposureTime) {
  if (!exposureTime) return "";
  const secs = shutterToSeconds(exposureTime);
  if (!secs || secs <= 0) return "";
  return SHUTTER_SPEEDS.reduce((best, curr) => {
    const bestDist = Math.abs(Math.log2(secs / shutterStrToSecs(best)));
    const currDist = Math.abs(Math.log2(secs / shutterStrToSecs(curr)));
    return currDist < bestDist ? curr : best;
  });
}

// Returns shutter speed as a decimal number e.g. 1/125 → 0.008
function shutterToSeconds(exposureTime) {
  if (!exposureTime) return "";
  const s = String(exposureTime).trim();
  if (s.includes("/")) {
    const [num, denom] = s.split("/").map(Number);
    const val = num / denom;
    // Round to 6 significant figures to avoid floating point noise
    return parseFloat(val.toPrecision(6));
  }
  const n = parseFloat(s.replace(/s$/i, ""));
  return isNaN(n) ? "" : n;
}

// Snaps a focal length to the nearest valid game value
function snapFocalLength(fl) {
  if (!fl && fl !== 0) return "";
  const n = parseFloat(fl);
  if (isNaN(n)) return "";
  return VALID_FOCAL_LENGTHS.reduce((best, curr) =>
    Math.abs(curr - n) < Math.abs(best - n) ? curr : best
  );
}

// Returns "City, Country" — empty string if location contains non-ASCII characters
function formatLocation(location) {
  if (!location) return "";
  const parts = [location.city, location.country].filter(v => v && v.trim());
  const result = parts.length > 0 ? parts.join(", ") : (location.name ?? "").trim();
  // Drop location if it contains any non-ASCII character
  return /[^\x00-\x7F]/.test(result) ? "" : result;
}

async function fetchPhoto(id) {
  const res = await fetch(`https://api.unsplash.com/photos/${id}?client_id=${API_KEY}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── AI comment generation ────────────────────────────────────────────────────
// Generates a completion-screen comment from raw EXIF data + photographer notes.
// Returns empty string if ANTHROPIC_API_KEY is missing or comment_notes is empty.
async function generateComment({ commentNotes, altDescription, camera, make, model,
  focalRaw, apertureRaw, shutterRaw, iso, location, photographer }) {
  if (!ANTHROPIC_API_KEY || !commentNotes || !commentNotes.trim()) return "";

  const cropFactor = getCropFactor(make, model);
  const ffEquiv = Math.round(focalRaw * cropFactor / 5) * 5;
  const cropNote = cropFactor !== 1.0
    ? `The camera has a ${cropFactor}x crop sensor. The raw focal length is ${focalRaw}mm, making the full-frame equivalent about ${ffEquiv}mm. In your comment, write: "about ${ffEquiv}mm (full frame equivalent after applying ${cropFactor}x crop factor to ${Math.round(focalRaw)}mm)"`
    : `The camera is full-frame — no crop factor applies. Focal length is ${Math.round(focalRaw)}mm.`;

  const prompt = `You are writing a completion-screen comment for PICCLE, a daily photography guessing game. The player has just finished guessing the camera settings for today's photo.

RAW EXIF DATA (use these values in your comment):
- Focal length: ${Math.round(focalRaw)}mm
- ${cropNote}
- Aperture: f/${apertureRaw}
- Shutter speed: ${shutterRaw}s
- ISO: ${iso || "unknown"}
- Location: ${location || "unknown"}
- Photographer: ${photographer || "unknown"}
- Image description: ${altDescription || "unknown"}

PHOTOGRAPHER'S NOTES (use to set emotional register and visual focus):
${commentNotes}

STYLE RULES — follow every one of these:
1. EXACTLY 4 sentences. Hard limit.
2. Do NOT open with "There's something [adjective] about..." — this is forbidden. Start with the most interesting technical fact, the image's emotional core, or the scene itself.
3. Do NOT end with reflective flourishes: "What stays with me...", "It's the kind of image that...", "Everything here conspires to...", "I love how the settings...". End on the image or the last technical point.
4. Always explain aperture jargon in parentheses: "fast (low number) aperture" or "slow (high number) aperture".
5. Explain the WHY behind each setting — what the photographer was trying to achieve.
6. Do NOT mention the camera model name in your comment.
7. Do NOT use em dashes (—). Use a space-hyphen-space ( - ) or rewrite with parentheses instead.
8. Do NOT use the multiplication sign x — write the letter x instead (e.g. "1.5x crop factor").
9. Only use plain ASCII punctuation. No Unicode symbols above standard quotes and apostrophes.
10. Do NOT start with "I". Do NOT use the word "perfect". No bullet points or line breaks.
11. Round all focal lengths to clean numbers in prose — write "105mm" not "103.9mm", "25mm" not "25.3mm".`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`Anthropic API ${res.status}: ${JSON.stringify(errBody)}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text?.trim() ?? "";
  } catch (err) {
    process.stderr.write(`  ⚠ comment generation failed: ${err.message}\n`);
    return "";
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let rows;
try {
  rows = parseCSV(readFileSync(INPUT_FILE, "utf8"));
} catch {
  console.error(`Could not read input file: ${INPUT_FILE}`);
  console.error("Create a CSV with a 'link' column containing Unsplash page URLs.");
  process.exit(1);
}

const linkColumn = rows[0]?.link !== undefined ? "link" : Object.keys(rows[0])[0];
console.log(`Reading ${rows.length} photo(s) from '${linkColumn}' column in ${INPUT_FILE}\n`);

if (ANTHROPIC_API_KEY) {
  console.log("ANTHROPIC_API_KEY found — comments will be generated for rows with comment_notes.\n");
} else {
  console.log("No ANTHROPIC_API_KEY in .env.local — comment column will be empty.\n");
}

const outputRows = [
  ["image", "link", "usable_link", "camera", "focal_length", "fl", "aperture_raw", "aperture", "shutter_speed", "ss", "iso", "location", "photographer", "comment", "completion_link"],
];

let successCount = 0;
let skipCount = 0;

for (let i = 0; i < rows.length; i++) {
  const pageUrl = rows[i][linkColumn];
  if (!pageUrl || !pageUrl.includes("unsplash.com")) {
    console.log(`Row ${i + 1}: skipping — not an Unsplash URL`);
    skipCount++;
    continue;
  }

  const id = extractPhotoId(pageUrl);
  process.stdout.write(`Row ${i + 1} (${id})... `);

  try {
    const data = await fetchPhoto(id);

    const make         = data.exif?.make ?? "";
    const model        = data.exif?.model ?? "";
    const camera       = formatCamera(make, model);
    const focalRaw     = data.exif?.focal_length ?? "";
    const fl           = snapFocalLength(focalRaw);
    const apertureRaw  = data.exif?.aperture ?? "";
    const aperture     = snapAperture(apertureRaw);
    const shutter      = formatShutter(data.exif?.exposure_time);  // raw EXIF string e.g. "1/200"
    const ss           = snapShutter(data.exif?.exposure_time);   // snapped game value e.g. "1/250"
    const iso          = data.exif?.iso ?? "";
    const location     = formatLocation(data.location);
    const photographer = data.user?.name ?? "";
    const altDescription = data.alt_description ?? data.description ?? "";
    // data.urls.regular is the authoritative CDN URL — the short page slug ID is not a valid CDN path
    const usableLink   = data.urls?.regular ?? "";

    // Skip rows where none of the key EXIF fields came back
    if (!focalRaw && !aperture && !shutter && !iso) {
      console.log(`skipped — no EXIF data returned`);
      skipCount++;
      continue;
    }

    const missing = Object.entries({ camera, focalRaw, aperture, shutter, iso })
      .filter(([, v]) => v === "" || v === null || v === undefined)
      .map(([k]) => k);
    if (missing.length > 0) {
      console.log(`⚠  ${photographer} — partial EXIF (missing: ${missing.join(", ")})`);
    } else {
      console.log(`✓  ${photographer} | ${camera} | ${focalRaw}mm→${fl}mm f/${aperture} ${shutter}→${ss} ISO${iso}`);
    }

    // Use existing comment from links.csv if present; otherwise generate from comment_notes
    const existingComment = rows[i].comment ?? "";
    const commentNotes    = rows[i].comment_notes ?? "";
    let comment = existingComment;
    if (!comment && commentNotes) {
      comment = await generateComment({
        commentNotes, altDescription, camera, make, model,
        focalRaw, apertureRaw, shutterRaw: shutter, iso, location, photographer,
      });
      if (comment) {
        console.log(`   ✓ comment generated`);
      } else {
        console.log(`   ⚠ comment skipped (generation failed or no API key)`);
      }
    } else if (existingComment) {
      console.log(`   ✓ comment taken from links.csv`);
    }

    // completion_link: use explicit column if set, else fall back to the Unsplash page URL
    const completionLink = rows[i].completion_link || pageUrl;

    outputRows.push([i + 1, pageUrl, usableLink, camera, focalRaw, fl, apertureRaw, aperture, shutter, ss, iso, location, photographer, comment, completionLink]);
    successCount++;
  } catch (err) {
    console.log(`skipped — ${err.message}`);
    skipCount++;
  }
}

function csvCell(value) {
  const s = String(value ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

const csv = outputRows.map(row => row.map(csvCell).join(",")).join("\n");
writeFileSync(OUTPUT_FILE, csv, "utf8");

console.log(`\n${successCount} rows written, ${skipCount} skipped.`);
console.log(`Output: ${OUTPUT_FILE}`);
