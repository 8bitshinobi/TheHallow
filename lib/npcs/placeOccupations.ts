import type { OccupationType } from "./tables";

export type PlaceOccupation = { occupation: string; occupationType: OccupationType };

/**
 * Occupation for the "Generate NPC" button next to a place's innkeeper/
 * proprietor field, based on the place's type/category. Businesses without a
 * `category`, and plain `place` objects, have no sensible mapping and are left
 * out on purpose (occupation is left blank rather than guessed).
 */
const BUSINESS_CATEGORY_OCCUPATIONS: Record<string, PlaceOccupation> = {
  Blacksmith: { occupation: "Blacksmith", occupationType: "Craft" },
  Stable: { occupation: "Stablemaster", occupationType: "Labor/Farming" },
  Apothecary: { occupation: "Apothecary", occupationType: "Scholar/Healer" },
  Jeweler: { occupation: "Jeweler", occupationType: "Craft" },
  "General goods": { occupation: "Shopkeeper", occupationType: "Merchant/Trade" },
  Tailor: { occupation: "Tailor", occupationType: "Craft" },
  Bakery: { occupation: "Baker", occupationType: "Craft" },
  Bookseller: { occupation: "Bookseller", occupationType: "Scholar/Healer" },
  "Wine/Spirits": { occupation: "Vintner", occupationType: "Merchant/Trade" },
  Pawnbroker: { occupation: "Pawnbroker", occupationType: "Merchant/Trade" },
  "Curio shop": { occupation: "Curio dealer", occupationType: "Merchant/Trade" },
  "Import warehouse": { occupation: "Importer", occupationType: "Merchant/Trade" },
  "Tea house": { occupation: "Tea master", occupationType: "Hospitality" },
  Moneylender: { occupation: "Moneylender", occupationType: "Merchant/Trade" },
  "Funeral parlor": { occupation: "Undertaker", occupationType: "Religious" },
  Bathhouse: { occupation: "Bathhouse keeper", occupationType: "Hospitality" },
};

const TAVERN_OCCUPATION: PlaceOccupation = { occupation: "Innkeeper", occupationType: "Hospitality" };

export function occupationForPlace(type: string, category?: string): PlaceOccupation | null {
  if (type.trim().toLowerCase() === "tavern") return TAVERN_OCCUPATION;
  if (category && BUSINESS_CATEGORY_OCCUPATIONS[category]) return BUSINESS_CATEGORY_OCCUPATIONS[category];
  return null;
}
