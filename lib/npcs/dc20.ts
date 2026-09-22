import { randomInt } from "@/lib/generatorShared";

/**
 * Novice-tier NPC stats per DC20 Magazine #3 (not the Monster Starter Pack or
 * the DC20 Field Guide site's data.js table — both give different numbers for
 * the same tier). Rolled fresh within Magazine #3's stated range each time,
 * except Check, which the magazine gives as a fixed value.
 */
const RANGES = {
  hp: [3, 5],
  pd: [8, 10],
  md: [5, 8],
  baseDamage: [0, 1],
} as const;

const NOVICE_CHECK = 2;

export type NoviceStats = {
  tier: "Novice";
  hp: number;
  pd: number;
  md: number;
  baseDamage: number;
  check: number;
};

export function generateNoviceStats(): NoviceStats {
  return {
    tier: "Novice",
    hp: randomInt(...RANGES.hp),
    pd: randomInt(...RANGES.pd),
    md: randomInt(...RANGES.md),
    baseDamage: randomInt(...RANGES.baseDamage),
    check: NOVICE_CHECK,
  };
}

/** Flattens to the dot-grouped properties the PropertiesEditor already understands. */
export function noviceStatsToProperties(stats: NoviceStats): Record<string, string> {
  return {
    "dc20.tier": stats.tier,
    "dc20.hp": String(stats.hp),
    "dc20.pd": String(stats.pd),
    "dc20.md": String(stats.md),
    "dc20.base_damage": String(stats.baseDamage),
    "dc20.check": `+${stats.check}`,
  };
}
