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
  proprietor: string;
  proprietorQuirk: string;
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
};

export type BusinessRerollField = "name" | "proprietor" | "goods" | "patrons" | "rumor" | "front";

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

function generateDescription(category: BusinessCategory, region: Region | null): string {
  const adjective = pick(DESCRIPTION_ADJECTIVES);
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

function generateGoods(category: BusinessCategory): string[] {
  return sample(category.goods, randomInt(4, 8));
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
  return {
    established: false,
    name: generateName(category),
    category: category.name,
    description: generateDescription(category, context.region),
    ...generateProprietor(),
    goods: generateGoods(category),
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
  switch (field) {
    case "name":
      return { ...card, name: generateName(category) };
    case "proprietor":
      return { ...card, ...generateProprietor() };
    case "goods":
      return { ...card, goods: generateGoods(category) };
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
