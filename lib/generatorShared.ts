import { INNKEEPER_FIRST, INNKEEPER_LAST } from "@/lib/taverns/tables";

/** Random helpers shared by the tavern and business generators. */
export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Picks one item, weighted: a weight of 3 is 3x as likely as a weight of 1. */
export function pickWeighted<T>(entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [item, weight] of entries) {
    roll -= weight;
    if (roll < 0) return item;
  }
  return entries[entries.length - 1][0];
}

/** Random items without repeats; returns fewer if the list is too short. */
export function sample<T>(list: readonly T[], count: number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

// ---------------------------------------------------------------------------
// Area (how well-off the part of the settlement is) — drives prices, staff
// size, and how the place is described.
// ---------------------------------------------------------------------------

export const AREAS = ["Poor", "Middle class", "Upper class"] as const;
export type Area = (typeof AREAS)[number];
export type AreaChoice = Area | "Any";

export function isArea(value: string | undefined): value is Area {
  return (AREAS as readonly string[]).includes(value ?? "");
}

export function resolveArea(choice: AreaChoice): Area {
  return choice === "Any" ? pick(AREAS) : choice;
}

/** Price multiplier per area, applied to each item's base (middle-class) price. */
const PRICE_MULTIPLIER: Record<Area, number> = {
  Poor: 0.6,
  "Middle class": 1,
  "Upper class": 2.2,
};

/** Staff size range per area: [taverns, businesses]. */
const STAFF_RANGE: Record<Area, { tavern: [number, number]; business: [number, number] }> = {
  Poor: { tavern: [1, 2], business: [0, 2] },
  "Middle class": { tavern: [2, 4], business: [1, 3] },
  "Upper class": { tavern: [3, 6], business: [2, 5] },
};

/** Adjectives mixed into descriptions so a place reads like its area. */
export const AREA_ADJECTIVES: Record<Area, string[]> = {
  Poor: ["shabby", "threadbare", "grimy", "sagging", "patched-up", "bare-bones"],
  "Middle class": ["respectable", "comfortable", "well-kept", "sturdy", "tidy"],
  "Upper class": ["opulent", "polished", "immaculate", "gilt-trimmed", "refined", "spotless"],
};

// ---------------------------------------------------------------------------
// Currency — PLACEHOLDER. The archive doesn't define one yet. Base prices in
// the tables are whole numbers of the smallest unit (cp); edit CURRENCY to
// rename or rescale it, and the tables/multipliers keep working.
// ---------------------------------------------------------------------------

/** Largest unit first. `value` is how many of the smallest unit it equals. */
const CURRENCY = [
  { unit: "gp", value: 100 },
  { unit: "sp", value: 10 },
  { unit: "cp", value: 1 },
];

export function formatPrice(baseCost: number, area: Area): string {
  let remaining = Math.max(1, Math.round(baseCost * PRICE_MULTIPLIER[area]));
  const parts: string[] = [];
  for (const { unit, value } of CURRENCY) {
    const count = Math.floor(remaining / value);
    if (count > 0) {
      parts.push(`${count} ${unit}`);
      remaining -= count * value;
    }
  }
  return parts.join(" ");
}

/** An item with its base (middle-class) price: [name, baseCost]. */
export type PricedItem = readonly [string, number];

/** "dark barley stout — 4 cp". Stored as plain text, one item per line. */
export function priceLine(item: PricedItem, area: Area): string {
  return `${item[0]} — ${formatPrice(item[1], area)}`;
}

export function pricedSample(items: readonly PricedItem[], count: number, area: Area): string[] {
  return sample(items, count).map((item) => priceLine(item, area));
}

/** "Hilde Ironside — cook". Fewer for poorer areas. */
export function generateEmployees(
  roles: readonly string[],
  area: Area,
  kind: "tavern" | "business"
): string[] {
  const [min, max] = STAFF_RANGE[area][kind];
  return sample(roles, randomInt(min, max)).map(
    (role) => `${pick(INNKEEPER_FIRST)} ${pick(INNKEEPER_LAST)} — ${role}`
  );
}
