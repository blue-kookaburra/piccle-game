export type SkillTier = "Master" | "Artisan" | "Keen Amateur" | "Enthusiast" | "Tourist";

export interface TierResult {
  tier: SkillTier;
  range: string;
  isMaster: boolean;
}

export function getSkillTier(score: number): TierResult {
  if (score >= 800) return { tier: "Master",      range: "800–1000", isMaster: true  };
  if (score >= 600) return { tier: "Artisan",      range: "600–799",  isMaster: false };
  if (score >= 400) return { tier: "Keen Amateur", range: "400–599",  isMaster: false };
  if (score >= 200) return { tier: "Enthusiast",   range: "200–399",  isMaster: false };
  return               { tier: "Tourist",       range: "0–199",    isMaster: false };
}
