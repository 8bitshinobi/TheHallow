"use server";

import { loadEstablishedPool } from "@/lib/generatorPool";

const TAVERN_CONFIG = {
  type: "tavern",
  textFields: [
    "description",
    "innkeeper",
    "innkeeper_quirk",
    "signature",
    "signature_kind",
    "icon",
    "area",
    "location",
  ],
  listFields: [
    ["employees"],
    ["drinks", "drink"],
    ["food", "food"],
    ["patrons", "patrons"],
    ["rumors", "rumor"],
  ],
} as const;

/** The in-app "established" tavern pool: everything not marked visibility=private. */
export async function getEstablishedTaverns(filters: { location?: string; area?: string }) {
  return loadEstablishedPool(TAVERN_CONFIG, filters);
}
