import {
  AREA_ADJECTIVES,
  generateEmployees,
  pricedSample,
  resolveArea,
  topUpList,
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
  toLines,
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
  /**
   * Fields that were blank (or, for list fields, under-populated) on a
   * real, established business and got randomly filled in for display (see
   * fillEstablishedBusinessBlanks) rather than coming from the archive.
   * Undefined/empty on a fully-real or brand-new card. Cleared once those
   * fields are actually saved.
   */
  rolledFields?: FillableBusinessField[];
  /**
   * For a list field that had SOME real items but fewer than a full
   * generation normally produces, how many freshly-generated items were
   * appended at the end (the rest of the array is real, untouched). Absent
   * for a field that was rerolled from fully blank (all of it is new) or
   * that needed no top-up at all.
   */
  toppedUp?: Partial<Record<ToppableBusinessField, number>>;
};

export type FillableBusinessField =
  | "description"
  | "proprietor"
  | "area"
  | "employees"
  | "goods"
  | "patrons"
  | "rumors"
  | "front";

export type ToppableBusinessField = "goods" | "patrons" | "rumors";

/** Minimum length a list field should have — below this, an established record's list is "topped up" rather than left sparse. Matches each field's normal generation range. */
const LIST_MINIMUMS: Record<ToppableBusinessField, number> = {
  goods: 4,
  patrons: 2,
  rumors: 2,
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
    case "goods": {
      // A topped-up field's real prefix is kept; only the added tail is
      // re-rolled, at the same total length as before.
      if (card.toppedUp?.goods !== undefined) {
        const real = card.goods.slice(0, card.goods.length - card.toppedUp.goods);
        return { ...card, goods: topUpList(real, () => generateGoods(category, area), card.goods.length).merged };
      }
      return { ...card, goods: generateGoods(category, area) };
    }
    case "employees":
      return { ...card, employees: generateStaff(category, area) };
    case "patrons": {
      if (card.toppedUp?.patrons !== undefined) {
        const real = card.patrons.slice(0, card.patrons.length - card.toppedUp.patrons);
        return { ...card, patrons: topUpList(real, () => generatePatrons(category), card.patrons.length).merged };
      }
      return { ...card, patrons: generatePatrons(category) };
    }
    case "rumor": {
      if (card.toppedUp?.rumors !== undefined) {
        const real = card.rumors.slice(0, card.rumors.length - card.toppedUp.rumors);
        return {
          ...card,
          rumors: topUpList(real, () => generateRumors(context.hooks, 2, 4), card.rumors.length, (r) => r.text)
            .merged,
        };
      }
      return { ...card, rumors: generateRumors(context.hooks, 2, 4) };
    }
    case "front":
      // Explicit request: always produces one, if this category can have one.
      return { ...card, front: generateFront(category, true) ?? card.front };
  }
}

/** Whether a category can have a hidden front (drives the "add front" button). */
export function canHaveFront(categoryName: string): boolean {
  return Boolean(CATEGORIES.find((category) => category.name === categoryName)?.front);
}

/**
 * For a real, established business that has some fields left blank in the
 * archive, rolls fresh values for just those fields — reusing the exact same
 * generator functions a brand-new business uses — so a sparse real record
 * still reads like a complete one at the table. Never touches a field that
 * already has a value. Returns which fields were actually filled in, via
 * `rolledFields`, so the UI can mark them as not-yet-real and offer to save
 * them into the archive.
 */
export function fillEstablishedBusinessBlanks(card: BusinessCard, context: BusinessContext): BusinessCard {
  const category = categoryByName(card.category);
  let next = card;
  const rolled: FillableBusinessField[] = [];
  const toppedUp: Partial<Record<ToppableBusinessField, number>> = {};

  // Area first: goods pricing and staff counts depend on it.
  if (!next.area) {
    next = { ...next, area: resolveArea(context.area) };
    rolled.push("area");
  }
  const area = next.area!;

  if (!next.description) {
    next = { ...next, description: generateDescription(category, context.region, area) };
    rolled.push("description");
  }
  if (!next.proprietor) {
    next = { ...next, ...generateProprietor() };
    rolled.push("proprietor");
  }
  if (next.employees.length === 0) {
    next = { ...next, employees: generateStaff(category, area) };
    rolled.push("employees");
  }

  // Goods/patrons/rumors: a real record with SOME items but fewer than a
  // full generation normally has isn't "blank" — it's sparse, often because
  // it predates this list-based feature. Top it up instead of leaving it
  // locked at one item with no way to add more.
  if (next.goods.length === 0) {
    next = { ...next, goods: generateGoods(category, area) };
    rolled.push("goods");
  } else if (next.goods.length < LIST_MINIMUMS.goods) {
    const { merged, addedCount } = topUpList(next.goods, () => generateGoods(category, area), LIST_MINIMUMS.goods);
    next = { ...next, goods: merged };
    rolled.push("goods");
    toppedUp.goods = addedCount;
  }

  if (next.patrons.length === 0) {
    next = { ...next, patrons: generatePatrons(category) };
    rolled.push("patrons");
  } else if (next.patrons.length < LIST_MINIMUMS.patrons) {
    const { merged, addedCount } = topUpList(next.patrons, () => generatePatrons(category), LIST_MINIMUMS.patrons);
    next = { ...next, patrons: merged };
    rolled.push("patrons");
    toppedUp.patrons = addedCount;
  }

  if (next.rumors.length === 0) {
    next = { ...next, rumors: generateRumors(context.hooks, 2, 4) };
    rolled.push("rumors");
  } else if (next.rumors.length < LIST_MINIMUMS.rumors) {
    const { merged, addedCount } = topUpList(
      next.rumors,
      () => generateRumors(context.hooks, 2, 4),
      LIST_MINIMUMS.rumors,
      (r) => r.text
    );
    next = { ...next, rumors: merged };
    rolled.push("rumors");
    toppedUp.rumors = addedCount;
  }

  if (!next.front) {
    // Same odds as first generation — a blank front might genuinely mean
    // "not a front for anything," not "not yet rolled," so this doesn't force one.
    const front = generateFront(category, false);
    if (front) {
      next = { ...next, front };
      rolled.push("front");
    }
  }

  return rolled.length > 0 ? { ...next, rolledFields: rolled, toppedUp } : next;
}

/** Storage-shaped properties for just a card's rolled (not-yet-real) fields, for saving them into the archive. */
export function rolledBusinessFieldsToProperties(card: BusinessCard): Record<string, string> {
  const properties: Record<string, string> = {};
  for (const field of card.rolledFields ?? []) {
    switch (field) {
      case "description":
        properties.description = card.description;
        break;
      case "proprietor":
        properties.proprietor = card.proprietor;
        properties.proprietor_quirk = card.proprietorQuirk;
        break;
      case "area":
        if (card.area) properties.area = card.area;
        break;
      case "employees":
        properties.employees = toLines(card.employees);
        break;
      case "goods":
        properties.goods = toLines(card.goods);
        break;
      case "patrons":
        properties.patrons = toLines(card.patrons);
        break;
      case "rumors":
        properties.rumors = toLines(card.rumors.map((rumor) => rumor.text));
        break;
      case "front":
        if (card.front) properties.front_for = card.front;
        break;
    }
  }
  return properties;
}
