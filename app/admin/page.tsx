"use client";

import { useState, FormEvent } from "react";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";

// Simple admin page for uploading images + scheduling daily challenges.
// Requires ADMIN_PASSWORD env var (checked server-side via /api/admin/upload).

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [shutter, setShutter] = useState(SHUTTER_SPEEDS[6]); // 1/125
  const [aperture, setAperture] = useState(APERTURES[7]);    // f/2.8
  const [focal, setFocal] = useState(String(FOCAL_LENGTHS[9])); // 50
  const [assignDate, setAssignDate] = useState("");
  const [description, setDescription] = useState("");
  const [credit, setCredit] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("password", password);
    formData.append("file", file);
    formData.append("shutter_speed", shutter);
    formData.append("aperture", aperture);
    formData.append("focal_length", focal);
    formData.append("description", description);
    formData.append("credit", credit);
    formData.append("assign_date", assignDate);

    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) {
      setStatus("✅ Image uploaded and scheduled!");
      setFile(null);
      setDescription("");
      setCredit("");
      setAssignDate("");
    } else {
      setStatus(`❌ ${data.error}`);
    }
    setLoading(false);
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
          style={{ width: "100%", padding: "10px", background: "#111", border: "1px solid #333", color: "#e8e0d0", borderRadius: 6, marginBottom: 12 }}
        />
        <button
          onClick={() => {
            // Quick client-side gate — real auth is checked server-side on upload
            if (password.length > 0) setAuthed(true);
          }}
          style={{ width: "100%", padding: "10px", background: "#e2b35a", color: "#000", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}
        >
          Enter
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: "0 20px", fontFamily: "monospace" }}>
      <h1 style={{ color: "#e2b35a", marginBottom: 24 }}>Upload Image</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ color: "#666", fontSize: 11 }}>Image file</label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ color: "#e8e0d0" }}
        />

        <label style={{ color: "#666", fontSize: 11 }}>Shutter speed</label>
        <select value={shutter} onChange={(e) => setShutter(e.target.value)} style={selectStyle}>
          {SHUTTER_SPEEDS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <label style={{ color: "#666", fontSize: 11 }}>Aperture</label>
        <select value={aperture} onChange={(e) => setAperture(e.target.value)} style={selectStyle}>
          {APERTURES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <label style={{ color: "#666", fontSize: 11 }}>Focal length</label>
        <select value={focal} onChange={(e) => setFocal(e.target.value)} style={selectStyle}>
          {FOCAL_LENGTHS.map((f) => <option key={f} value={String(f)}>{f}mm</option>)}
        </select>

        <label style={{ color: "#666", fontSize: 11 }}>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Mountain at golden hour"
          style={inputStyle}
        />

        <label style={{ color: "#666", fontSize: 11 }}>Photographer credit</label>
        <input
          type="text"
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          placeholder="e.g. Jane Smith / Unsplash"
          style={inputStyle}
        />

        <label style={{ color: "#666", fontSize: 11 }}>Assign to date</label>
        <input
          type="date"
          value={assignDate}
          onChange={(e) => setAssignDate(e.target.value)}
          required
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "12px", background: "#e2b35a", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 13, letterSpacing: "0.1em", opacity: loading ? 0.5 : 1 }}
        >
          {loading ? "Uploading…" : "UPLOAD & SCHEDULE"}
        </button>

        {status && <p style={{ color: status.startsWith("✅") ? "#22c55e" : "#ef4444", fontSize: 12 }}>{status}</p>}
      </form>
    </main>
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
};

const selectStyle: React.CSSProperties = { ...inputStyle };
