// Tutorial chapter definitions.
// Images served via Supabase image transforms (/render/image/) for fast loading.

export type TutorialChapterType = "text" | "aperture" | "shutter" | "iso" | "focal" | "done";

export interface TutorialImageEntry {
  value: string;    // display label, e.g. "f/2.8"
  imageUrl: string; // Supabase public URL
  iso?: number;     // shown in overlay (aperture + iso chapters)
}

export interface TutorialChapterDef {
  type: TutorialChapterType;
  title: string;
  body: string;
  footnote?: string; // rendered in a separate box (used in "done" chapter)
  images?: TutorialImageEntry[]; // exactly 3 for interactive chapters
}

const BASE = "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/render/image/public/shutter-shaper/tutorial";
const OPT  = "?width=900&quality=80";

export const TUTORIAL_CHAPTERS: TutorialChapterDef[] = [
  // ── Intro ─────────────────────────────────────────────────────────────────
  {
    type: "text",
    title: "Welcome to the Darkroom",
    body: "Piccle gives you three camera dials to guess. Before you play, let's see what each one actually does to an image. Spin the dial — the photo changes in real time.",
  },

  // ── Aperture text ─────────────────────────────────────────────────────────
  {
    type: "text",
    title: "Aperture — the eye of the lens",
    body: "Aperture controls how wide the lens opens. This is the setting that determines how much of the image is in focus. A wide aperture (low f-number like f/2.8) lets in lots of light and blurs the background. A narrow aperture (high f-number like f/16) keeps everything sharp from front to back.",
  },

  // ── Aperture interactive ──────────────────────────────────────────────────
  {
    type: "aperture",
    title: "Try the aperture dial",
    body: "Spin left or right to see depth of field change - look at the words on the book in the background.",
    images: [
      { value: "f/3.2", imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35f3.2.JPG",  iso: 250 },
      { value: "f/8",   imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35f8.JPG",   iso: 1600 },
      { value: "f/16",  imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35f16.JPG",  iso: 6400 },
    ],
  },

  // ── Shutter text ──────────────────────────────────────────────────────────
  {
    type: "text",
    title: "Shutter Speed — freezing time",
    body: "Shutter speed controls how long the sensor is exposed to light. A fast shutter (1/1000s) freezes motion. A slow shutter (1/4s) smears moving objects into blur — useful for silky waterfalls, light trails or if you really need to capture more light and don't mind a bit of motion blur.",
  },

  // ── Shutter interactive ───────────────────────────────────────────────────
  {
    type: "shutter",
    title: "Try the shutter dial",
    body: "Spin left or right to see motion blur change.",
    images: [
      { value: "1/1000", imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35%201-500s.JPG", iso: 6400 },
      { value: "1/60",   imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35%201-30s.JPG",   iso: 800 },
      { value: "1/4",    imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35%201-4s.JPG",    iso: 125 },
    ],
  },

  // ── ISO text ───────────────────────────────────────────────────────────────
  {
    type: "text",
    title: "ISO — sensitivity to light",
    body: "ISO controls how sensitive the sensor is. Low ISO (100) produces a clean, detailed image. High ISO (3200) introduces 'grain' — but lets you shoot in low light. If you were perceptive, you would have noticed that the ISO changed in the previous shots. ISO was set to 'Auto' so the camera's computer decided what ISO value was 'correct' for an even exposure. In Piccle, the ISO is always given to you as a clue so there's no dial for it.",
  },

  // ── ISO interactive (reuses aperture images, highlights ISO) ─────────────
  {
    type: "iso",
    title: "Watch the ISO",
    body: "Spin the aperture dial again — this time, watch how the ISO number in the bottom-left climbs as the aperture narrows.",
    images: [
      { value: "f/3.2", imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35f3.2.JPG",  iso: 250 },
      { value: "f/8",   imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35f8.JPG",   iso: 1600 },
      { value: "f/16",  imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35f16.JPG",  iso: 6400 },
    ],
  },

  // ── Focal text ────────────────────────────────────────────────────────────
  {
    type: "text",
    title: "Focal Length — the reach of the lens",
    body: "Focal length determines how much of the scene fits in the frame. Basically, it's how 'zoomed in' your lens is. Focal length affects how close together different elements of your image appear. Wide lenses (18mm) capture a broad view and push things apart. Long lenses (175mm) magnify distant subjects and compress depth, making backgrounds appear closer.",
  },

  // ── Focal interactive ─────────────────────────────────────────────────────
  {
    type: "focal",
    title: "Try the focal length dial",
    body: "Spin left or right to see how the field of view changes. Note that in these images, the photographer has tried to keep half of the frame filled with the Christmas decoration, and so had to move towards the subject when shooting at 18mm, and moved further away when shooting at 85mm.",
    images: [
      { value: "18mm",  imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/12.JPG",   iso: 2000 },
      { value: "35mm",  imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/35f8.JPG",   iso: 2000 },
      { value: "85mm",  imageUrl: "https://sujqmtbhydpohxeuuukw.supabase.co/storage/v1/object/public/shutter-shaper/tutorial/85.JPG",  iso: 2000 },
    ],
  },

  // ── Done ──────────────────────────────────────────────────────────────────
  {
    type: "done",
    title: "You're ready to shoot",
    body: "Now you know what aperture, shutter speed, ISO and focal length do. Every day there's a new photo — guess the three settings used to take it with ISO as a clue.",
    footnote: "You can always come back here to play this tutorial in HOW TO.",
  },
];

// Indices within the canonical camera-values arrays for each tutorial dial.
// These correspond to the 3 images above.
export const TUTORIAL_APERTURE_INDICES = [10, 18, 24]; // f/3.2, f/8, f/16
export const TUTORIAL_SHUTTER_INDICES  = [3, 7, 11];  // 1/1000, 1/60, 1/4
export const TUTORIAL_FOCAL_INDICES    = [4, 8, 13]; // 18mm, 35mm, 85mm
