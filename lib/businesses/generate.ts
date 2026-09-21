import {
  AREA_ADJECTIVES,
  generateEmployees,
  pricedSample,
  resolveArea,
  type Area,
  type AreaChoice,
} from "@/lib/generatorShared";
import { INNKEEPER_FIRST, INNKEEPER_LAST } from "@/lib/taverns/tables";
import {
  generateRumors,
  pick,
  randomInt,
  sample,
  themeWords,
  type GenContext,
  type Region,
  type Rumor,
} from "@/lib/taverns/generate";
import {
  CATEGORIES,
  DESCRIPTION_ADJECTIVES,
  DESCRIPTION_TAILS,
  DESCRIPTION_THEMED_TAILS,
  GENERIC_PATRONS,
  GENERIC_ROLES,
  NAME_ADJECTIVES,
  NAME_PATTERNS,
  PROPRIETOR_QUIRKS,
  type BusinessCategory,
} from "./tables";

export type BusinessCard = {
  /** True when this is a real, public business from the archive. */
  established: boolean;
  id?: string;
  /** Manual icon override from the stored business, if it has one. */
  icon?: string;
  name: string;
  category: string;
  description: string;
  /** How well-off the part of the settlement is; drives prices, staff and tone. */
  area?: Area;
  employees: string[];
  proprietor: string;
  proprietorQuirk: string;
  /** Lines like "horseshoes — 4 cp". */
  goods: string[];
  patrons: string[];
  rumors: Rumor[];
  /** GM-only hidden activity ("Fence: ..."). Never comes from the public API. */
  front?: string;
  location: string;
  locationId?: string;
};

export type BusinessContext = Pick<GenContext, "region" | "hooks"> & {
  /** Category name, or "Any". */
  category: string;
  area: AreaChoice;
};

export type BusinessRerollField =
  | "name"
  | "proprietor"
  | "goods"
  | "patrons"
  | "rumor"
  | "front"
  | "employees";

function categoryByName(name: string): BusinessCategory {
  return CATEGORIES.find((category) => category.name === name) ?? pick(CATEGORIES);
}

function generateName(category: BusinessCategory): string {
  const surname = pick(INNKEEPER_LAST);
  let surname2 = pick(INNKEEPER_LAST);
  while (surname2 === surname) surname2 = pick(INNKEEPER_LAST);
  return pick(NAME_PATTERNS)
    .replace("{adj}", pick(NAME_ADJECTIVES))
    .replace("{surname}", surname)
    .replace("{surname2}", surname2)
    .replace("{noun}", pick(category.nouns));
}

function generateDescription(category: BusinessCategory, region: Region | null, area: Area): string {
  const adjective = pick([...DESCRIPTION_ADJECTIVES, ...AREA_ADJECTIVES[area]]);
  const article = /^[aeiou]/i.test(adjective) ? "An" : "A";
  const words = themeWords(region);
  const tail = words.length
    ? pick(DESCRIPTION_THEMED_TAILS).replace("{theme}", pick(words))
    : pick(DESCRIPTION_TAILS);
  return `${article} ${adjective} ${category.shop} ${tail}.`;
}

function generateProprietor(): { proprietor: string; proprietorQuirk: string } {
  return {
    proprietor: `${pick(INNKEEPER_FIRST)} ${pick(INNKEEPER_LAST)}`,
    proprietorQuirk: pick(PROPRIETOR_QUIRKS),
  };
}

function generateGoods(category: BusinessCategory, area: Area): string[] {
  return pricedSample(category.goods, randomInt(4, 8), area);
}

function generateStaff(category: BusinessCategory, area: Area): string[] {
  return generateEmployees([...new Set([...category.roles, ...GENERIC_ROLES])], area, "business");
}

function generatePatrons(category: BusinessCategory): string[] {
  return sample([...GENERIC_PATRONS, ...category.patrons], randomInt(2, 6));
}

function generateFront(category: BusinessCategory, force: boolean): string | undefined {
  const front = category.front;
  if (!front) return undefined;
  if (!force && Math.random() >= front.chance) return undefined;
  return `${front.label}: ${pick(front.details)}`;
}

export function generateBusiness(context: BusinessContext): BusinessCard {
  const category = context.category === "Any" ? pick(CATEGORIES) : categoryByName(context.category);
  const area = resolveArea(context.area);
  return {
    established: false,
    name: generateName(category),
    category: category.name,
    description: generateDescription(category, context.region, area),
    ...generateProprietor(),
    area,
    employees: generateStaff(category, area),
    goods: generateGoods(category, area),
    patrons: generatePatrons(category),
    rumors: generateRumors(context.hooks, 2, 4),
    front: generateFront(category, false),
    location: context.region?.name ?? "",
    locationId: context.region?.id,
  };
}

export function rerollBusinessField(
  card: BusinessCard,
  field: BusinessRerollField,
  context: BusinessContext
): BusinessCard {
  const category = categoryByName(card.category);
  // A card keeps its own area when rerolling; only a brand-new generation re-reads the filter.
  const area = card.area ?? resolveArea(context.area);
  switch (field) {
    case "name":
      return { ...card, name: generateName(category) };
    case "proprietor":
      return { ...card, ...generateProprietor() };
    case "goods":
      return { ...card, goods: generateGoods(category, area) };
    case "employees":
      return { ...card, employees: generateStaff(category, area) };
    case "patrons":
      return { ...card, patrons: generatePatrons(category) };
    case "rumor":
      return { ...card, rumors: generateRumors(context.hooks, 2, 4) };
    case "front":
      // Explicit request: always produces one, if this category can have one.
      return { ...card, front: generateFront(category, true) ?? card.front };
  }
}

/** Whether a category can have a hidden front (drives the "add front" button). */
export function canHaveFront(categoryName: string): boolean {
  return Boolean(CATEGORIES.find((category) => category.name === categoryName)?.front);
}
