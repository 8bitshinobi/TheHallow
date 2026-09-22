"use server";

import { loadEstablishedPool } from "@/lib/generatorPool";

const BUSINESS_CONFIG = {
  type: "business",
  textFields: [
    "category",
    "area",
    "description",
    "proprietor",
    "proprietor_quirk",
    "icon",
    "location",
  ],
  listFields: [["employees"], ["goods"], ["patrons"], ["rumors"]],
} as const;

/** The in-app "established" business pool: everything not marked visibility=private. */
export async function getEstablishedBusinesses(filters: {
  location?: string;
  category?: string;
  area?: string;
}) {
  return loadEstablishedPool(BUSINESS_CONFIG, filters);
}
