// Fallback data used when NEXT_PUBLIC_SUPABASE_URL is not set.
// Lets you run and test the UI locally with zero backend setup.
// Images are from Unsplash (free to use).
//
// NOTE: imageUrl must come from the `usable_link` column of scripts/output.csv.
// Re-run `node scripts/fetch-exif.mjs YOUR_KEY` after adding new photos to get
// correct Unsplash CDN URLs — the short slug IDs in page URLs are NOT the CDN IDs.

export interface ChallengeData {
  imageUrl: string;
  challengeNumber: number;
  challengeDate: string;
  // Shown under the photo during play (not EXIF game answers)
  camera?: string;
  iso?: number;
  photographer?: string;
  tag?: string;
}

export interface AnswerData {
  // Snapped values — what the game scores against
  shutter: string;
  aperture: string;
  focal: number;
  // Original EXIF values — shown in the result card for context
  shutterOriginal?: string;
  apertureOriginal?: string;
  focalOriginal?: number;
  description: string;
  credit: string;
  // Link to the original photo on Unsplash (revealed after game ends)
  unsplashUrl?: string;
}

// One test challenge per date offset (index 0 = today, 1 = yesterday, etc.)
const TEST_CHALLENGES: Array<ChallengeData & AnswerData> = [
  {
    // Suspension bridge — Zheng XUE, Nikon Z6 III, 120mm→105mm, f/18, 1/125, ISO 640
    imageUrl: "https://images.unsplash.com/photo-1773929651401-04db346329dd?ixid=M3w5MDkwODJ8MHwxfGFsbHx8fHx8fHx8fDE3NzUxNzA5MDF8&ixlib=rb-4.1.0&w=1200&q=80&fm=jpg",
    challengeNumber: 1,
    challengeDate: "",
    camera: "Nikon Z6 III",
    iso: 640,
    photographer: "Zheng XUE",
    shutter: "1/125",
    aperture: "f/18",
    focal: 105,
    focalOriginal: 120,
    description: "",
    credit: "Zheng XUE",
    unsplashUrl: "https://unsplash.com/photos/red-suspension-bridge-over-a-river-with-city-skyline-_WEddfPLeeA",
  },
  {
    // Sunflower field — Lia Den, Nikon Z5, 50mm, f/2.8, 1/200→1/250, ISO 100
    imageUrl: "https://images.unsplash.com/photo-1725355083896-5ce98ad26f3a?ixid=M3w5MDkwODJ8MHwxfGFsbHx8fHx8fHx8fDE3NzUxNzA5MDJ8&ixlib=rb-4.1.0&w=1200&q=80&fm=jpg",
    challengeNumber: 2,
    challengeDate: "",
    camera: "Nikon Z5",
    iso: 100,
    photographer: "Lia Den",
    shutter: "1/250",
    shutterOriginal: "1/200",
    aperture: "f/2.8",
    focal: 50,
    description: "",
    credit: "Lia Den",
    unsplashUrl: "https://unsplash.com/photos/a-woman-standing-in-a-field-of-sunflowers-TmJ70AXBOKg",
  },
  {
    // Mount Fuji — PJH, Sony A7 IV, 31mm→28mm, f/4, 1/2500→1/2000, ISO 100
    imageUrl: "https://images.unsplash.com/photo-1774173511909-3a9f9ab208cb?ixid=M3w5MDkwODJ8MHwxfGFsbHx8fHx8fHx8fDE3NzUxNzA5MDJ8&ixlib=rb-4.1.0&w=1200&q=80&fm=jpg",
    challengeNumber: 3,
    challengeDate: "",
    camera: "Sony A7 IV",
    iso: 100,
    photographer: "PJH",
    shutter: "1/2000",
    shutterOriginal: "1/2500",
    aperture: "f/4",
    focal: 28,
    focalOriginal: 31,
    description: "",
    credit: "PJH",
    unsplashUrl: "https://unsplash.com/photos/mount-fuji-seen-over-red-kochia-bushes-qSHMHyjL0Fc",
  },
  {
    // Hong Kong — Harrison Lin, Sony A7C II, 60mm, f/5.6, 1/200→1/250, ISO 640
    imageUrl: "https://images.unsplash.com/photo-1756086807815-d8c4676197dc?ixid=M3w5MDkwODJ8MHwxfGFsbHx8fHx8fHx8fDE3NzUxNzA5MDN8&ixlib=rb-4.1.0&w=1200&q=80&fm=jpg",
    challengeNumber: 4,
    challengeDate: "",
    camera: "Sony A7C II",
    iso: 640,
    photographer: "Harrison Lin",
    shutter: "1/250",
    shutterOriginal: "1/200",
    aperture: "f/5.6",
    focal: 60,
    description: "Hong Kong",
    credit: "Harrison Lin",
    unsplashUrl: "https://unsplash.com/photos/dKxvmVH7Bi0",
  },
];

export function getTestChallenge(date: string): (ChallengeData & AnswerData) | null {
  // Rotate through test challenges by day offset from a base date
  const base = new Date("2026-03-27");
  const d = new Date(date);
  const dayOffset = Math.floor(
    (d.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
  );
  const idx = ((dayOffset % TEST_CHALLENGES.length) + TEST_CHALLENGES.length) % TEST_CHALLENGES.length;
  const challenge = { ...TEST_CHALLENGES[idx], challengeDate: date };
  return challenge;
}
