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
  TAVERN_ROLES,
  SIGNATURE_ADJECTIVES,
  SIGNATURE_DRINK_BASES,
  SIGNATURE_DRINK_EFFECTS,
  SIGNATURE_FOOD_BASES,
  SIGNATURE_FOOD_EFFECTS,
  type Crowd,
} from "./tables";
export { isCrowd } from "./tables";
import {
  AREA_ADJECTIVES,
  generateEmployees,
  pick,
  pricedSample,
  randomInt,
  resolveArea,
  sample,
  formatPrice,
  type Area,
  type AreaChoice,
} from "@/lib/generatorShared";

// Re-exported so existing imports (the business generator) keep working.
export { pick, randomInt, sample };

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
  /** How well-off the part of the settlement is; drives prices, staff and tone. */
  area?: Area;
  employees: string[];
  /** Lines like "dark barley stout — 4 cp". */
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
  /**
   * Fields that were blank on a real, established tavern and got randomly
   * filled in for display (see fillEstablishedTavernBlanks) rather than
   * coming from the archive. Undefined/empty on a fully-real or brand-new
   * card. Cleared once those fields are actually saved.
   */
  rolledFields?: FillableTavernField[];
};

export type FillableTavernField =
  | "description"
  | "innkeeper"
  | "area"
  | "employees"
  | "drinks"
  | "food"
  | "patrons"
  | "rumors"
  | "signature";

export type GenContext = {
  region: Region | null;
  crowd: CrowdChoice;
  area: AreaChoice;
  /** Names of public lore records; empty falls back to placeholder hooks. */
  hooks: string[];
};

export type RerollField =
  | "name"
  | "innkeeper"
  | "menu"
  | "patrons"
  | "rumor"
  | "signature"
  | "employees";

export function themeWords(region: Region | null): string[] {
  return (region?.theme ?? "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

function generateDrinks(area: Area): string[] {
  return pricedSample(DRINKS, randomInt(3, 5), area);
}

function generateFood(area: Area): string[] {
  return pricedSample(FOODS, randomInt(5, 7), area);
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

function generateDescription(region: Region | null, area: Area): string {
  const adjective = pick([...DESCRIPTION_ADJECTIVES, ...AREA_ADJECTIVES[area]]);
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

function generateSignature(region: Region | null, area: Area): Signature {
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
    // House specialties cost a premium over ordinary fare (base 8-20 cp).
    signature: `${pick(SIGNATURE_ADJECTIVES)} ${base}${hint}: ${effect}. (${formatPrice(randomInt(8, 20), area)})`,
    signatureKind: kind,
  };
}

function maybeSignature(region: Region | null, area: Area): Signature | Record<string, never> {
  return Math.random() < SIGNATURE_CHANCE ? generateSignature(region, area) : {};
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
  const area = resolveArea(context.area);
  return {
    established: false,
    name: generateName(),
    description: generateDescription(context.region, area),
    ...generateInnkeeper(),
    area,
    employees: generateEmployees(TAVERN_ROLES, area, "tavern"),
    drinks: generateDrinks(area),
    food: generateFood(area),
    patrons: generatePatrons(context.crowd),
    rumors: generateRumors(context.hooks),
    ...maybeSignature(context.region, area),
    location: context.region?.name ?? "",
    locationId: context.region?.id,
    crowd: context.crowd,
  };
}

export function rerollField(card: TavernCard, field: RerollField, context: GenContext): TavernCard {
  // A card keeps its own area when rerolling; only a brand-new generation re-reads the filter.
  const area = card.area ?? resolveArea(context.area);
  switch (field) {
    case "name":
      return { ...card, name: generateName() };
    case "innkeeper":
      return { ...card, ...generateInnkeeper() };
    case "menu":
      return { ...card, drinks: generateDrinks(area), food: generateFood(area) };
    case "patrons":
      return { ...card, crowd: context.crowd, patrons: generatePatrons(context.crowd) };
    case "rumor":
      return { ...card, rumors: generateRumors(context.hooks) };
    case "signature":
      // Explicit request: always produces one, unlike first generation.
      return { ...card, signatureKind: undefined, ...generateSignature(context.region, area) };
    case "employees":
      return { ...card, employees: generateEmployees(TAVERN_ROLES, area, "tavern") };
  }
}

/**
 * For a real, established tavern that has some fields left blank in the
 * archive, rolls fresh values for just those fields — reusing the exact same
 * generator functions a brand-new tavern uses — so a sparse real record
 * still reads like a complete one at the table. Never touches a field that
 * already has a value. Returns which fields were actually filled in, via
 * `rolledFields`, so the UI can mark them as not-yet-real and offer to save
 * them into the archive.
 */
export function fillEstablishedTavernBlanks(card: TavernCard, context: GenContext): TavernCard {
  let next = card;
  const rolled: FillableTavernField[] = [];

  // Area first: drinks/food/employees pricing and counts depend on it.
  if (!next.area) {
    next = { ...next, area: resolveArea(context.area) };
    rolled.push("area");
  }
  const area = next.area!;

  if (!next.description) {
    next = { ...next, description: generateDescription(context.region, area) };
    rolled.push("description");
  }
  if (!next.innkeeper) {
    next = { ...next, ...generateInnkeeper() };
    rolled.push("innkeeper");
  }
  if (next.employees.length === 0) {
    next = { ...next, employees: generateEmployees(TAVERN_ROLES, area, "tavern") };
    rolled.push("employees");
  }
  if (next.drinks.length === 0) {
    next = { ...next, drinks: generateDrinks(area) };
    rolled.push("drinks");
  }
  if (next.food.length === 0) {
    next = { ...next, food: generateFood(area) };
    rolled.push("food");
  }
  if (next.patrons.length === 0) {
    const crowd = next.crowd && next.crowd !== "Any" ? next.crowd : context.crowd;
    next = { ...next, crowd, patrons: generatePatrons(crowd) };
    rolled.push("patrons");
  }
  if (next.rumors.length === 0) {
    next = { ...next, rumors: generateRumors(context.hooks) };
    rolled.push("rumors");
  }
  if (!next.signature) {
    // Same odds as first generation — a blank signature might genuinely mean
    // "no specialty," not "not yet rolled," so this doesn't force one.
    const maybe = maybeSignature(context.region, area);
    if ("signature" in maybe) {
      next = { ...next, ...maybe };
      rolled.push("signature");
    }
  }

  return rolled.length > 0 ? { ...next, rolledFields: rolled } : next;
}

/** Storage-shaped properties for just a card's rolled (not-yet-real) fields, for saving them into the archive. */
export function rolledTavernFieldsToProperties(card: TavernCard): Record<string, string> {
  const properties: Record<string, string> = {};
  for (const field of card.rolledFields ?? []) {
    switch (field) {
      case "description":
        properties.description = card.description;
        break;
      case "innkeeper":
        properties.innkeeper = card.innkeeper;
        properties.innkeeper_quirk = card.innkeeperQuirk;
        break;
      case "area":
        if (card.area) properties.area = card.area;
        break;
      case "employees":
        properties.employees = toLines(card.employees);
        break;
      case "drinks":
        properties.drinks = toLines(card.drinks);
        break;
      case "food":
        properties.food = toLines(card.food);
        break;
      case "patrons":
        properties.patrons = toLines(card.patrons);
        if (card.crowd) properties.patron_crowd = card.crowd;
        break;
      case "rumors":
        properties.rumors = toLines(card.rumors.map((rumor) => rumor.text));
        break;
      case "signature":
        if (card.signature) properties.signature = card.signature;
        if (card.signatureKind) properties.signature_kind = card.signatureKind;
        break;
    }
  }
  return properties;
}
