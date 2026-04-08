"use client";

import { useState, FormEvent } from "react";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";

// Simple admin page for uploading images + scheduling daily challenges.
// Requires ADMIN_PASSWORD env var (checked server-side via /api/admin/upload).

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
  // If set, shown in the result card as "EXIF 1/127" next to the snapped value.
  const [shutterOriginal, setShutterOriginal] = useState("");
  const [focalOriginal, setFocalOriginal]     = useState("");

  // ── Camera info (shown in image overlay during gameplay) ─────────────────
  const [camera, setCamera]   = useState(""); // e.g. "Sony A7C II"
  const [iso, setIso]         = useState("");

  // ── Attribution ──────────────────────────────────────────────────────────
  const [photographer, setPhotographer]   = useState(""); // shown in overlay
  const [credit, setCredit]               = useState(""); // e.g. "Jane Smith / Unsplash"
  const [unsplashUrl, setUnsplashUrl]     = useState(""); // makes credit link clickable
  const [completionLink, setCompletionLink] = useState(""); // "View photo ↗" in result card

  // ── Editorial ────────────────────────────────────────────────────────────
  const [description, setDescription] = useState(""); // short scene description
  const [comment, setComment]         = useState(""); // custom explanation (overrides auto-generated)

  const [status, setStatus]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("password", password);
    formData.append("file", file);
    formData.append("assign_date", assignDate);

    // Game settings
    formData.append("shutter_speed", shutter);
    formData.append("aperture", aperture);
    formData.append("focal_length", focal);
    if (shutterOriginal) formData.append("shutter_speed_original", shutterOriginal);
    if (focalOriginal)   formData.append("focal_length_original", focalOriginal);

    // Camera info
    if (camera) formData.append("camera", camera);
    if (iso)    formData.append("iso", iso);

    // Attribution
    if (photographer)   formData.append("photographer", photographer);
    if (credit)         formData.append("credit", credit);
    if (unsplashUrl)    formData.append("unsplash_url", unsplashUrl);
    if (completionLink) formData.append("completion_link", completionLink);

    // Editorial
    if (description) formData.append("description", description);
    if (comment)     formData.append("comment", comment);

    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: formData });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (res.ok) {
        setStatus("✅ Image uploaded and scheduled!");
        setFile(null);
        setAssignDate("");
        setShutter(SHUTTER_SPEEDS[6]);
        setAperture(APERTURES[7]);
        setFocal(String(FOCAL_LENGTHS[9]));
        setShutterOriginal("");
        setFocalOriginal("");
        setCamera("");
        setIso("");
        setPhotographer("");
        setCredit("");
        setUnsplashUrl("");
        setCompletionLink("");
        setDescription("");
        setComment("");
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
    <main style={{ maxWidth: 520, margin: "40px auto", padding: "0 20px 60px", fontFamily: "monospace" }}>
      <h1 style={{ color: "#e2b35a", marginBottom: 24 }}>Upload Image</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Image + date ── */}
        <SectionLabel>Image</SectionLabel>
        <FieldLabel>Image file *</FieldLabel>
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ color: "#e8e0d0" }}
        />
        <FieldLabel>Assign to date *</FieldLabel>
        <input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} required style={inputStyle} />

        {/* ── Game settings ── */}
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
        <select value={shutterOriginal} onChange={(e) => setShutterOriginal(e.target.value)} style={selectStyle}>
          <option value="">— same as above —</option>
          {SHUTTER_SPEEDS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <FieldLabel hint="Only if EXIF differs from snapped value — shown in result card">EXIF focal length (original)</FieldLabel>
        <select value={focalOriginal} onChange={(e) => setFocalOriginal(e.target.value)} style={selectStyle}>
          <option value="">— same as above —</option>
          {FOCAL_LENGTHS.map((f) => <option key={f} value={String(f)}>{f}mm</option>)}
        </select>

        {/* ── Camera info ── */}
        <SectionLabel>Camera info <span style={{ color: "#555", fontWeight: 400 }}>— shown in image overlay</span></SectionLabel>
        <FieldLabel>Camera make + model</FieldLabel>
        <input type="text" value={camera} onChange={(e) => setCamera(e.target.value)} placeholder="e.g. Sony A7C II" style={inputStyle} />

        <FieldLabel>ISO</FieldLabel>
        <input type="number" value={iso} onChange={(e) => setIso(e.target.value)} placeholder="e.g. 400" min={50} max={102400} style={inputStyle} />

        {/* ── Attribution ── */}
        <SectionLabel>Attribution</SectionLabel>
        <FieldLabel hint="Shown in image overlay (just the name)">Photographer name</FieldLabel>
        <input type="text" value={photographer} onChange={(e) => setPhotographer(e.target.value)} placeholder="e.g. Jane Smith" style={inputStyle} />

        <FieldLabel hint="Full credit line shown in result card">Credit</FieldLabel>
        <input type="text" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="e.g. Jane Smith / Unsplash" style={inputStyle} />

        <FieldLabel hint="Makes the credit line a clickable link in the result card">Unsplash / source URL</FieldLabel>
        <input type="url" value={unsplashUrl} onChange={(e) => setUnsplashUrl(e.target.value)} placeholder="https://unsplash.com/photos/…" style={inputStyle} />

        <FieldLabel hint="Shows a 'View photo ↗' button in the result card">Completion link</FieldLabel>
        <input type="url" value={completionLink} onChange={(e) => setCompletionLink(e.target.value)} placeholder="https://…" style={inputStyle} />

        {/* ── Editorial ── */}
        <SectionLabel>Editorial</SectionLabel>
        <FieldLabel hint="Short scene description — shown in result card and used to generate the explanation">Description</FieldLabel>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Mountain peak at golden hour" style={inputStyle} />

        <FieldLabel hint="Custom explanation shown in result card — leave blank to auto-generate from settings">Explanation / comment</FieldLabel>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. The fast shutter freezes the waterfall mid-flow…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 8, padding: "12px", background: "#e2b35a", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 13, letterSpacing: "0.1em", opacity: loading ? 0.5 : 1 }}
        >
          {loading ? "Uploading…" : "UPLOAD & SCHEDULE"}
        </button>

        {status && <p style={{ color: status.startsWith("✅") ? "#22c55e" : "#ef4444", fontSize: 12 }}>{status}</p>}
      </form>
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
