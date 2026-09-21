import {
  CROWDS,
  DESCRIPTION_ADJECTIVES,
  DESCRIPTION_TAILS,
  DESCRIPTION_THEMED_TAILS,
  DRINKS,
  FOODS,
  GOSSIP_RUMORS,
  INNKEEPER_FIRST,
  INNKEEPER_LAST,
  INNKEEPER_QUIRKS,
  KINDS,
  LORE_RUMOR_TEMPLATES,
  NAME_FIRST,
  NAME_PATTERNS,
  NAME_SECOND,
  PATRONS,
  PLACEHOLDER_LORE_HOOKS,
  SIGNATURE_ADJECTIVES,
  SIGNATURE_DRINK_BASES,
  SIGNATURE_DRINK_EFFECTS,
  SIGNATURE_FOOD_BASES,
  SIGNATURE_FOOD_EFFECTS,
  type Crowd,
} from "./tables";

export type CrowdChoice = Crowd | "Any";
export type RumorKind = "gossip" | "lore" | "lore-placeholder";

export type Rumor = { text: string; kind?: RumorKind };

/** List-valued fields are stored in a single string property, one item per line. */
export function toLines(items: string[]): string {
  return items.join("\n");
}

export function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Chance that a new tavern gets a house specialty. */
const SIGNATURE_CHANCE = 0.25;

export type Region = {
  id: string;
  name: string;
  theme: string;
  /** Region-authored house specialties (region property tavern_specialties, one per line). */
  specialties: string[];
};

export type TavernCard = {
  /** True when this is a real, public tavern from the archive. */
  established: boolean;
  id?: string;
  /** Manual icon override from the stored tavern, if it has one. */
  icon?: string;
  name: string;
  description: string;
  innkeeper: string;
  innkeeperQuirk: string;
  drinks: string[];
  food: string[];
  patrons: string[];
  /** `kind` is only known for newly generated rumors. */
  rumors: Rumor[];
  /** A house specialty: something the tavern is known for. Optional. */
  signature?: string;
  signatureKind?: "drink" | "food";
  location: string;
  locationId?: string;
  /** The crowd choice used; "Any" mixes every crowd's patrons. */
  crowd?: CrowdChoice;
};

export type GenContext = {
  region: Region | null;
  crowd: CrowdChoice;
  /** Names of public lore records; empty falls back to placeholder hooks. */
  hooks: string[];
};

export type RerollField = "name" | "innkeeper" | "menu" | "patrons" | "rumor" | "signature";

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function themeWords(region: Region | null): string[] {
  return (region?.theme ?? "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
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

function generateDrinks(): string[] {
  return sample(DRINKS, randomInt(3, 5));
}

function generateFood(): string[] {
  return sample(FOODS, randomInt(5, 7));
}

function generatePatrons(choice: CrowdChoice): string[] {
  const pool = choice === "Any" ? CROWDS.flatMap((crowd) => PATRONS[crowd]) : PATRONS[choice];
  return sample(pool, randomInt(3, 15));
}

function generateName(): string {
  const first = pick(NAME_FIRST);
  const second = pick(NAME_SECOND);
  let second2 = pick(NAME_SECOND);
  while (second2 === second) second2 = pick(NAME_SECOND);
  return pick(NAME_PATTERNS)
    .replace("{first}", first)
    .replace("{second}", second)
    .replace("{second2}", second2)
    .replace("{kind}", () => {
      const kind = pick(KINDS);
      return kind.charAt(0).toUpperCase() + kind.slice(1);
    });
}

function generateDescription(region: Region | null): string {
  const adjective = pick(DESCRIPTION_ADJECTIVES);
  const kind = pick(KINDS);
  const article = /^[aeiou]/i.test(adjective) ? "An" : "A";
  const words = themeWords(region);
  const tail = words.length
    ? pick(DESCRIPTION_THEMED_TAILS).replace("{theme}", pick(words))
    : pick(DESCRIPTION_TAILS);
  return `${article} ${adjective} ${kind} ${tail}.`;
}

function generateInnkeeper(): { innkeeper: string; innkeeperQuirk: string } {
  return {
    innkeeper: `${pick(INNKEEPER_FIRST)} ${pick(INNKEEPER_LAST)}`,
    innkeeperQuirk: pick(INNKEEPER_QUIRKS),
  };
}

type Signature = { signature: string; signatureKind?: "drink" | "food" };

function generateSignature(region: Region | null): Signature {
  // Region-authored specialties are the real location link; use them if any exist.
  if (region && region.specialties.length > 0) {
    return { signature: pick(region.specialties) };
  }
  const kind = Math.random() < 0.5 ? "drink" : "food";
  const base = pick(kind === "drink" ? SIGNATURE_DRINK_BASES : SIGNATURE_FOOD_BASES);
  const effect = pick(kind === "drink" ? SIGNATURE_DRINK_EFFECTS : SIGNATURE_FOOD_EFFECTS);
  const words = themeWords(region);
  const hint = words.length ? ` (think: ${pick(words)})` : "";
  return {
    signature: `${pick(SIGNATURE_ADJECTIVES)} ${base}${hint}: ${effect}.`,
    signatureKind: kind,
  };
}

function maybeSignature(region: Region | null): Signature | Record<string, never> {
  return Math.random() < SIGNATURE_CHANCE ? generateSignature(region) : {};
}

export function generateRumors(hooks: string[], min = 3, max = 5): Rumor[] {
  const total = randomInt(min, max);
  const usingPlaceholders = hooks.length === 0;
  const hookPool = usingPlaceholders ? PLACEHOLDER_LORE_HOOKS : hooks;

  // About half lore, half gossip; lore is capped by how many distinct hooks
  // exist so the same hook isn't repeated within one tavern.
  let loreCount = 0;
  for (let i = 0; i < total; i++) if (Math.random() < 0.5) loreCount++;
  loreCount = Math.min(loreCount, hookPool.length, LORE_RUMOR_TEMPLATES.length);

  const loreHooks = sample(hookPool, loreCount);
  const templates = sample(LORE_RUMOR_TEMPLATES, loreCount);
  const lore: Rumor[] = loreHooks.map((hook, i) => ({
    text: templates[i].replace("{hook}", hook),
    kind: usingPlaceholders ? "lore-placeholder" : "lore",
  }));
  const gossip: Rumor[] = sample(GOSSIP_RUMORS, total - loreCount).map((text) => ({
    text,
    kind: "gossip",
  }));

  return sample([...lore, ...gossip], total);
}

export function generateTavern(context: GenContext): TavernCard {
  return {
    established: false,
    name: generateName(),
    description: generateDescription(context.region),
    ...generateInnkeeper(),
    drinks: generateDrinks(),
    food: generateFood(),
    patrons: generatePatrons(context.crowd),
    rumors: generateRumors(context.hooks),
    ...maybeSignature(context.region),
    location: context.region?.name ?? "",
    locationId: context.region?.id,
    crowd: context.crowd,
  };
}

export function rerollField(card: TavernCard, field: RerollField, context: GenContext): TavernCard {
  switch (field) {
    case "name":
      return { ...card, name: generateName() };
    case "innkeeper":
      return { ...card, ...generateInnkeeper() };
    case "menu":
      return { ...card, drinks: generateDrinks(), food: generateFood() };
    case "patrons":
      return { ...card, crowd: context.crowd, patrons: generatePatrons(context.crowd) };
    case "rumor":
      return { ...card, rumors: generateRumors(context.hooks) };
    case "signature":
      // Explicit request: always produces one, unlike first generation.
      return { ...card, signatureKind: undefined, ...generateSignature(context.region) };
  }
}
