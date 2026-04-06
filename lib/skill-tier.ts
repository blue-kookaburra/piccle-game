export type SkillTier = "Master" | "Artisan" | "Keen Amateur" | "Enthusiast" | "Tourist";

export interface TierResult {
  tier: SkillTier;
  range: string;
  isMaster: boolean;
}

export function getSkillTier(score: number): TierResult {
  if (score >= 950) return { tier: "Master",      range: "950–1000", isMaster: true  };
  if (score >= 750) return { tier: "Artisan",      range: "750–949",  isMaster: false };
  if (score >= 500) return { tier: "Keen Amateur", range: "500–749",  isMaster: false };
  if (score >= 250) return { tier: "Enthusiast",   range: "250–499",  isMaster: false };
  return               { tier: "Tourist",       range: "0–249",    isMaster: false };
}
