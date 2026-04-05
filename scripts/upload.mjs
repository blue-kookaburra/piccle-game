// Uploads photos from scripts/output.csv into Supabase and schedules them as daily challenges.
//
// Usage:
//   node scripts/upload.mjs [--from YYYY-MM-DD]
//
// --from sets the first date to schedule. Defaults to the day after the last
// already-scheduled challenge, or tomorrow if the table is empty.
//
// Requires in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY=your-service-role-key   (Settings → API → service_role)

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ─── Load .env.local ──────────────────────────────────────────────────────────
const envLines = readFileSync(".env.local", "utf8").split("\n");
const env = Object.fromEntries(
  envLines
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(l => l.split("=").map((p, i) => (i === 0 ? p : l.slice(l.indexOf("=") + 1))))
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_KEY  = env["SUPABASE_SERVICE_KEY"];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Parse --from argument ────────────────────────────────────────────────────
const fromArg = process.argv.includes("--from")
  ? process.argv[process.argv.indexOf("--from") + 1]
  : null;

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

// ─── Date helpers ─────────────────────────────────────────────────────────────
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0];
}

function tomorrow() {
  return addDays(new Date().toISOString().split("T")[0], 1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let rows;
try {
  rows = parseCSV(readFileSync("scripts/output.csv", "utf8"));
} catch {
  console.error("Could not read scripts/output.csv — run fetch-exif.mjs first.");
  process.exit(1);
}

console.log(`Found ${rows.length} row(s) in output.csv\n`);

// Work out the starting date
let startDate;
if (fromArg) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromArg)) {
    console.error("--from date must be YYYY-MM-DD");
    process.exit(1);
  }
  startDate = fromArg;
} else {
  // Find the last already-scheduled date in Supabase
  const { data: last } = await supabase
    .from("daily_challenges")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  startDate = last?.date ? addDays(last.date, 1) : tomorrow();
}

console.log(`Scheduling from ${startDate}\n`);

let successCount = 0;
let skipCount = 0;

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const assignDate = addDays(startDate, i);

  const usableLink = row.usable_link;
  if (!usableLink) {
    console.log(`Row ${i + 1}: skipped — no usable_link`);
    skipCount++;
    continue;
  }

  process.stdout.write(`Row ${i + 1} (${row.photographer || "?"} — ${assignDate})... `);

  // Build the image record
  const imageRecord = {
    storage_url:            usableLink,
    shutter_speed:          row.ss || row.shutter_speed || null,  // snapped game value
    aperture:               row.aperture ? `f/${row.aperture}` : null,
    focal_length:           row.fl ? parseInt(row.fl) : null,
    description:            row.location || null,
    credit:                 row.photographer || null,
    // Extended fields (requires ALTER TABLE — see CLAUDE.md)
    camera:                 row.camera || null,
    iso:                    row.iso ? parseInt(row.iso) : null,
    photographer:           row.photographer || null,
    location:               row.location || null,
    shutter_speed_original: row.shutter_speed || null,   // raw EXIF (unsnapped)
    focal_length_original:  row.focal_length ? parseInt(row.focal_length) : null,
    comment:                row.comment || null,
    completion_link:        row.completion_link || null,
  };

  // Insert into images table
  const { data: img, error: imgErr } = await supabase
    .from("images")
    .insert(imageRecord)
    .select("id")
    .single();

  if (imgErr) {
    console.log(`failed — ${imgErr.message}`);
    skipCount++;
    continue;
  }

  // Schedule in daily_challenges
  const { error: dcErr } = await supabase
    .from("daily_challenges")
    .insert({ date: assignDate, image_id: img.id });

  if (dcErr) {
    console.log(`image inserted (${img.id}) but scheduling failed — ${dcErr.message}`);
    skipCount++;
    continue;
  }

  console.log(`✓  ${assignDate}`);
  successCount++;
}

console.log(`\n${successCount} uploaded and scheduled, ${skipCount} skipped.`);
