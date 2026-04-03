// Fetches EXIF data from Unsplash API for a list of photo page URLs.
//
// Usage:
//   node scripts/fetch-exif.mjs YOUR_ACCESS_KEY [input.csv]
//
// Input CSV must have a column named "link" containing Unsplash page URLs:
//   https://unsplash.com/photos/some-description-AbCdEfGhI
//
// Defaults to scripts/links.csv if no input file specified.
// Output: scripts/output.csv

import { readFileSync, writeFileSync } from "fs";

const API_KEY = process.argv[2];
const INPUT_FILE = process.argv[3] || "scripts/links.csv";

if (!API_KEY) {
  console.error("Usage: node scripts/fetch-exif.mjs YOUR_ACCESS_KEY [input.csv]");
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

const outputRows = [
  ["image", "link", "usable_link", "camera", "focal_length", "fl", "aperture_raw", "aperture", "shutter_speed", "ss", "iso", "location", "photographer"],
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

    const camera       = formatCamera(data.exif?.make ?? "", data.exif?.model ?? "");
    const focalRaw     = data.exif?.focal_length ?? "";
    const fl           = snapFocalLength(focalRaw);
    const apertureRaw  = data.exif?.aperture ?? "";
    const aperture     = snapAperture(apertureRaw);
    const shutter      = formatShutter(data.exif?.exposure_time);
    const ss           = shutterToSeconds(data.exif?.exposure_time);
    const iso          = data.exif?.iso ?? "";
    const location     = formatLocation(data.location);
    const photographer = data.user?.name ?? "";
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
      console.log(`✓  ${photographer} | ${camera} | ${focalRaw}mm→${fl}mm f/${aperture} ${shutter}(${ss}s) ISO${iso}`);
    }

    outputRows.push([i + 1, pageUrl, usableLink, camera, focalRaw, fl, apertureRaw, aperture, shutter, ss, iso, location, photographer]);
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
writeFileSync("scripts/output.csv", csv, "utf8");

console.log(`\n${successCount} rows written, ${skipCount} skipped.`);
console.log("Output: scripts/output.csv");
