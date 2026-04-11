"use client";

import { useState, useEffect, FormEvent } from "react";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";
import { createClient } from "@/lib/supabase/client";

// Simple admin page for uploading images + scheduling daily challenges.
// Requires ADMIN_PASSWORD env var (checked server-side via /api/admin/upload).

interface WeeklyEntry {
  date: string;
  image: {
    storage_url: string;
    shutter_speed: string;
    aperture: string;
    focal_length: number;
    description?: string;
    photographer?: string;
    camera?: string;
    iso?: number;
    credit?: string;
  } | null;
  plays: number;
  solves: number;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed]     = useState(false);

  // ── Image file + schedule ────────────────────────────────────────────────
  const [file, setFile]           = useState<File | null>(null);
  const [assignDate, setAssignDate] = useState("");

  // ── Game settings ────────────────────────────────────────────────────────
  const [shutter, setShutter]   = useState(SHUTTER_SPEEDS[6]); // 1/125
  const [aperture, setAperture] = useState(APERTURES[7]);       // f/2.8
  const [focal, setFocal]       = useState(String(FOCAL_LENGTHS[9])); // 50mm

  // EXIF originals — only needed when EXIF doesn't match a canonical game value.
  const [shutterOriginal, setShutterOriginal] = useState("");
  const [focalOriginal, setFocalOriginal]     = useState("");

  // ── Camera info ──────────────────────────────────────────────────────────
  const [camera, setCamera]   = useState("");
  const [iso, setIso]         = useState("");

  // ── Attribution ──────────────────────────────────────────────────────────
  const [photographer, setPhotographer]   = useState("");
  const [credit, setCredit]               = useState("");
  const [unsplashUrl, setUnsplashUrl]     = useState("");
  const [completionLink, setCompletionLink] = useState("");

  // ── Editorial ────────────────────────────────────────────────────────────
  const [description, setDescription] = useState("");
  const [comment, setComment]         = useState("");
  const [tag, setTag]                 = useState("");

  const [status, setStatus]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewDate, setPreviewDate] = useState("");

  // ── Weekly summary ───────────────────────────────────────────────────────
  const [weeklyData, setWeeklyData]     = useState<WeeklyEntry[] | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<WeeklyEntry | null>(null);

  // globals.css locks html+body overflow for the game page — unlock it here
  useEffect(() => {
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Fetch last 7 days of challenges + stats when admin logs in
  useEffect(() => {
    if (!authed || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    async function fetchWeekly() {
      const supabase = createClient();
      const today    = new Date().toLocaleDateString("en-CA");
      const fromDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA");

      const { data: challenges } = await supabase
        .from("daily_challenges")
        .select("date, images(storage_url, shutter_speed, aperture, focal_length, description, photographer, camera, iso, credit)")
        .gte("date", fromDate)
        .lte("date", today)
        .order("date", { ascending: false });

      if (!challenges?.length) { setWeeklyData([]); return; }

      const dates = challenges.map((c) => c.date);
      const { data: stats } = await supabase
        .from("daily_stats")
        .select("date, total_plays, total_solves")
        .in("date", dates);

      const statsMap = Object.fromEntries((stats ?? []).map((s) => [s.date, s]));

      setWeeklyData(challenges.map((c) => ({
        date:   c.date,
        image:  Array.isArray(c.images) ? (c.images[0] ?? null) : (c.images as WeeklyEntry["image"] ?? null),
        plays:  statsMap[c.date]?.total_plays  ?? 0,
        solves: statsMap[c.date]?.total_solves ?? 0,
      })));
    }

    fetchWeekly();
  }, [authed]);

  // Resize image to max 2048px on longest side, JPEG 85% — keeps files under 4MB
  async function resizeImage(src: File): Promise<Blob> {
    const MAX_PX = 2048;
    const bitmap = await createImageBitmap(src);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_PX / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width  = Math.round(width  * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise(resolve => canvas.toBlob(b => resolve(b!), "image/jpeg", 0.85));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus("Resizing image…");
    const resized = await resizeImage(file);
    setStatus("Uploading…");

    const formData = new FormData();
    formData.append("password", password);
    formData.append("file", resized, file.name.replace(/\.[^.]+$/, ".jpg"));
    formData.append("assign_date", assignDate);

    formData.append("shutter_speed", shutter);
    formData.append("aperture", aperture);
    formData.append("focal_length", focal);
    if (shutterOriginal) formData.append("shutter_speed_original", shutterOriginal);
    if (focalOriginal)   formData.append("focal_length_original", focalOriginal);

    if (camera) formData.append("camera", camera);
    if (iso)    formData.append("iso", iso);

    if (photographer)   formData.append("photographer", photographer);
    if (credit)         formData.append("credit", credit);
    if (unsplashUrl)    formData.append("unsplash_url", unsplashUrl);
    if (completionLink) formData.append("completion_link", completionLink);

    if (description) formData.append("description", description);
    if (comment)     formData.append("comment", comment);
    if (tag)         formData.append("tag", tag);

    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: formData });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (res.ok) {
        setStatus("✅ Image uploaded and scheduled!");
        setFile(null); setAssignDate("");
        setShutter(SHUTTER_SPEEDS[6]); setAperture(APERTURES[7]); setFocal(String(FOCAL_LENGTHS[9]));
        setShutterOriginal(""); setFocalOriginal("");
        setCamera(""); setIso("");
        setPhotographer(""); setCredit(""); setUnsplashUrl(""); setCompletionLink("");
        setDescription(""); setComment(""); setTag("");
      } else {
        setStatus(`❌ ${data.error ?? `Server error ${res.status}`}`);
      }
    } catch (err) {
      setStatus(`❌ ${err instanceof Error ? err.message : "Unexpected error"}`);
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 20px", fontFamily: "monospace" }}>
        <h1 style={{ color: "#e2b35a", marginBottom: 24 }}>Admin</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.nextElementSibling instanceof HTMLButtonElement && e.currentTarget.nextElementSibling.click()}
          style={{ width: "100%", padding: "10px", background: "#111", border: "1px solid #333", color: "#e8e0d0", borderRadius: 6, marginBottom: 12 }}
        />
        <button
          onClick={async () => {
            if (!password) return;
            const res = await fetch("/api/admin/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });
            if (res.ok) {
              setAuthed(true);
            } else {
              const data = await res.json();
              alert(data.error ?? "Incorrect password");
            }
          }}
          style={{ width: "100%", padding: "10px", background: "#e2b35a", color: "#000", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}
        >
          Enter
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 20px 80px", fontFamily: "monospace" }}>
      <h1 style={{ color: "#e2b35a", marginBottom: 28 }}>Admin</h1>

      {/* ── Weekly Summary ────────────────────────────────────────────── */}
      <section style={{ marginBottom: 40 }}>
        <p style={sectionLabelStyle}>Last 7 days</p>

        {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <p style={{ color: "#444", fontSize: 12, marginTop: 12 }}>Connect Supabase to view stats.</p>
        )}

        {process.env.NEXT_PUBLIC_SUPABASE_URL && weeklyData === null && (
          <p style={{ color: "#444", fontSize: 12, marginTop: 12 }}>Loading…</p>
        )}

        {process.env.NEXT_PUBLIC_SUPABASE_URL && weeklyData?.length === 0 && (
          <p style={{ color: "#444", fontSize: 12, marginTop: 12 }}>No challenges scheduled in the last 7 days.</p>
        )}

        {weeklyData && weeklyData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, marginTop: 12 }}>
            {weeklyData.map((entry) => {
              const solveRate = entry.plays > 0 ? Math.round((entry.solves / entry.plays) * 100) : null;
              const isToday   = entry.date === new Date().toLocaleDateString("en-CA");
              return (
                <div
                  key={entry.date}
                  onClick={() => setSelectedEntry(entry)}
                  style={{ position: "relative", paddingTop: "100%", cursor: "pointer", background: "#111", overflow: "hidden", borderRadius: 2 }}
                >
                  {/* Thumbnail */}
                  {entry.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.image.storage_url}
                      alt={entry.date}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: 11 }}>no image</div>
                  )}

                  {/* Bottom gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)", pointerEvents: "none" }} />

                  {/* Date + solve rate */}
                  <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, pointerEvents: "none" }}>
                    <div style={{ color: isToday ? "#e2b35a" : "#aaa", fontSize: 10, letterSpacing: "0.04em" }}>
                      {isToday ? "TODAY" : entry.date}
                    </div>
                    {solveRate !== null ? (
                      <div style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>{solveRate}%</div>
                    ) : (
                      <div style={{ color: "#555", fontSize: 11 }}>no plays</div>
                    )}
                  </div>

                  {/* Play count badge */}
                  {entry.plays > 0 && (
                    <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "#ccc", fontSize: 10, padding: "2px 6px", borderRadius: 10, pointerEvents: "none" }}>
                      {entry.plays}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Upload form (constrained to narrower width) ───────────────── */}
      <div style={{ maxWidth: 520 }}>
        <p style={sectionLabelStyle}>Upload Image</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>

          <SectionLabel>Image</SectionLabel>
          <FieldLabel>Image file *</FieldLabel>
          <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ color: "#e8e0d0" }} />
          <FieldLabel>Assign to date *</FieldLabel>
          <input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} required style={inputStyle} />

          <SectionLabel>Game settings</SectionLabel>
          <FieldLabel>Shutter speed *</FieldLabel>
          <select value={shutter} onChange={(e) => setShutter(e.target.value)} style={selectStyle}>
            {SHUTTER_SPEEDS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <FieldLabel>Aperture *</FieldLabel>
          <select value={aperture} onChange={(e) => setAperture(e.target.value)} style={selectStyle}>
            {APERTURES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <FieldLabel>Focal length *</FieldLabel>
          <select value={focal} onChange={(e) => setFocal(e.target.value)} style={selectStyle}>
            {FOCAL_LENGTHS.map((f) => <option key={f} value={String(f)}>{f}mm</option>)}
          </select>

          <FieldLabel hint="Only if EXIF differs from snapped value — shown in result card">EXIF shutter (original)</FieldLabel>
          <input type="text" value={shutterOriginal} onChange={(e) => setShutterOriginal(e.target.value)} placeholder="e.g. 1/200, 1/30 — leave blank if same" style={inputStyle} />

          <FieldLabel hint="Only if EXIF differs from snapped value — shown in result card">EXIF focal length (original)</FieldLabel>
          <input type="number" value={focalOriginal} onChange={(e) => setFocalOriginal(e.target.value)} placeholder="e.g. 35 — leave blank if same" min={1} max={2000} style={inputStyle} />

          <SectionLabel>Camera info <span style={{ color: "#555", fontWeight: 400 }}>— shown in image overlay</span></SectionLabel>
          <FieldLabel>Camera make + model</FieldLabel>
          <input type="text" value={camera} onChange={(e) => setCamera(e.target.value)} placeholder="e.g. Sony A7C II" style={inputStyle} />

          <FieldLabel>ISO</FieldLabel>
          <input type="number" value={iso} onChange={(e) => setIso(e.target.value)} placeholder="e.g. 400" min={50} max={102400} style={inputStyle} />

          <SectionLabel>Attribution</SectionLabel>
          <FieldLabel hint="Shown in image overlay (just the name)">Photographer name</FieldLabel>
          <input type="text" value={photographer} onChange={(e) => setPhotographer(e.target.value)} placeholder="e.g. Jane Smith" style={inputStyle} />

          <FieldLabel hint="Full credit line shown in result card">Credit</FieldLabel>
          <input type="text" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="e.g. Jane Smith / Unsplash" style={inputStyle} />

          <FieldLabel hint="Makes the credit line a clickable link in the result card">Unsplash / source URL</FieldLabel>
          <input type="url" value={unsplashUrl} onChange={(e) => setUnsplashUrl(e.target.value)} placeholder="https://unsplash.com/photos/…" style={inputStyle} />

          <FieldLabel hint="Shows a 'View photo ↗' button in the result card">Completion link</FieldLabel>
          <input type="url" value={completionLink} onChange={(e) => setCompletionLink(e.target.value)} placeholder="https://…" style={inputStyle} />

          <SectionLabel>Editorial</SectionLabel>
          <FieldLabel hint="Short scene description — shown in result card and used to generate the explanation">Description</FieldLabel>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Mountain peak at golden hour" style={inputStyle} />

          <FieldLabel hint="Custom explanation shown in result card — leave blank to auto-generate from settings">Explanation / comment</FieldLabel>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. The fast shutter freezes the waterfall mid-flow…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />

          <FieldLabel hint="Optional — labels a themed run of days, shown in the image overlay and result card">Theme tag</FieldLabel>
          <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. Fujifilm Week, Landscapes Week" style={inputStyle} />

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, padding: "12px", background: "#e2b35a", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 13, letterSpacing: "0.1em", opacity: loading ? 0.5 : 1 }}
          >
            {loading ? "Uploading…" : "UPLOAD & SCHEDULE"}
          </button>

          {status && <p style={{ color: status.startsWith("✅") ? "#22c55e" : "#ef4444", fontSize: 12 }}>{status}</p>}
        </form>

        {/* ── Preview Mode ── */}
        <div style={{ marginTop: 32, borderTop: "1px solid #222", paddingTop: 24 }}>
          <p style={sectionLabelStyle}>Preview Mode</p>
          <p style={{ color: "#555", fontSize: 11, marginTop: 8, marginBottom: 12 }}>
            Play the game for any scheduled date — results won&apos;t be recorded in Supabase.
          </p>
          <input
            type="date"
            value={previewDate}
            onChange={(e) => setPreviewDate(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={() => { if (previewDate) window.open(`/?preview=${previewDate}`, "_blank"); }}
            disabled={!previewDate}
            style={{ marginTop: 10, width: "100%", padding: "10px", background: "#222", color: previewDate ? "#e8e0d0" : "#444", border: "1px solid #333", borderRadius: 6, cursor: previewDate ? "pointer" : "default", fontSize: 13, fontFamily: "monospace", letterSpacing: "0.08em" }}
          >
            OPEN PREVIEW ↗
          </button>
        </div>
      </div>

      {/* ── Expanded entry modal ──────────────────────────────────────── */}
      {selectedEntry && (
        <div
          onClick={() => setSelectedEntry(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0e0e0e", border: "1px solid #222", borderRadius: 10, maxWidth: 560, width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            {/* Image */}
            {selectedEntry.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedEntry.image.storage_url}
                alt={selectedEntry.date}
                style={{ width: "100%", maxHeight: 320, objectFit: "cover" }}
              />
            )}

            {/* Details */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#e2b35a", fontSize: 15, fontWeight: "bold" }}>{selectedEntry.date}</span>
                <button onClick={() => setSelectedEntry(null)} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
              </div>

              {/* Camera settings */}
              <div style={{ display: "flex", gap: 0, borderRadius: 6, overflow: "hidden", border: "1px solid #222" }}>
                <StatCell label="Shutter"  value={selectedEntry.image?.shutter_speed ?? "—"} />
                <StatCell label="Aperture" value={selectedEntry.image?.aperture ?? "—"} border />
                <StatCell label="Focal"    value={selectedEntry.image ? `${selectedEntry.image.focal_length}mm` : "—"} border />
                {selectedEntry.image?.iso && <StatCell label="ISO" value={String(selectedEntry.image.iso)} border />}
              </div>

              {/* Play stats */}
              <div style={{ display: "flex", gap: 0, borderRadius: 6, overflow: "hidden", border: "1px solid #222" }}>
                <StatCell label="Plays"    value={String(selectedEntry.plays)} />
                <StatCell label="Solves"   value={String(selectedEntry.solves)} border />
                <StatCell
                  label="Solve rate"
                  value={selectedEntry.plays > 0 ? `${Math.round(selectedEntry.solves / selectedEntry.plays * 100)}%` : "—"}
                  border
                  highlight={selectedEntry.plays > 0}
                />
              </div>

              {/* Meta */}
              {selectedEntry.image?.camera && (
                <p style={{ color: "#555", fontSize: 11 }}>📷 {selectedEntry.image.camera}</p>
              )}
              {selectedEntry.image?.photographer && (
                <p style={{ color: "#666", fontSize: 11 }}>by {selectedEntry.image.photographer}</p>
              )}
              {selectedEntry.image?.description && (
                <p style={{ color: "#888", fontSize: 12, lineHeight: 1.5 }}>{selectedEntry.image.description}</p>
              )}

              {/* Preview link */}
              <button
                onClick={() => window.open(`/?preview=${selectedEntry.date}`, "_blank")}
                style={{ padding: "9px", background: "#1a1a1a", color: "#e8e0d0", border: "1px solid #333", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.06em" }}
              >
                OPEN PREVIEW ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: "#e2b35a", fontSize: 11, fontWeight: "bold", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 8, marginBottom: -4, borderTop: "1px solid #222", paddingTop: 16 }}>
      {children}
    </p>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ color: "#666", fontSize: 11 }}>
      {children}
      {hint && <span style={{ color: "#444", marginLeft: 6 }}>— {hint}</span>}
    </label>
  );
}

function StatCell({ label, value, border, highlight }: { label: string; value: string; border?: boolean; highlight?: boolean }) {
  return (
    <div style={{ flex: 1, padding: "10px 14px", background: "#111", borderLeft: border ? "1px solid #222" : undefined }}>
      <div style={{ color: "#444", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ color: highlight ? "#e2b35a" : "#e8e0d0", fontSize: 15, fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  color: "#e2b35a",
  fontSize: 11,
  fontWeight: "bold",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  background: "#111",
  border: "1px solid #333",
  color: "#e8e0d0",
  borderRadius: 6,
  fontFamily: "monospace",
  fontSize: 13,
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = { ...inputStyle };
