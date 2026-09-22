"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { loadEstablishedPool } from "@/lib/generatorPool";
import { FRONT_CAPABLE_CATEGORY_NAMES } from "@/lib/businesses/tables";

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
    // Unlike the anonymous public API (app/api/businesses/route.ts), this
    // in-app pool is GM-only, so it's fine to also surface the real
    // GM-only front here.
    "front_for",
  ],
  listFields: [["employees"], ["goods"], ["patrons"], ["rumors"]],
} as const;

/**
 * The in-app "established" business pool: everything not marked
 * visibility=private. `frontsOnly` narrows this to businesses whose
 * category can have a hidden front at all — not just ones that already
 * have one saved, since fillEstablishedBusinessBlanks forces a front onto
 * any front-capable result once frontsOnly is set.
 */
export async function getEstablishedBusinesses(filters: {
  location?: string;
  category?: string;
  area?: string;
  frontsOnly?: boolean;
}) {
  const { frontsOnly, ...rest } = filters;
  const results = await loadEstablishedPool(BUSINESS_CONFIG, rest);
  if (!frontsOnly) return results;
  return results.filter((item) => FRONT_CAPABLE_CATEGORY_NAMES.includes(item.category as string));
}

/**
 * Writes freshly-rolled values for specific blank fields into a real,
 * already-existing business (see fillEstablishedBusinessBlanks / the
 * "rolled" tags in the UI). Merges into the object's current properties —
 * re-read fresh here, not trusted from the client — rather than replacing
 * them wholesale, so nothing else on the object is touched.
 */
export async function saveRolledBusinessFields(
  id: string,
  fields: Record<string, string>
): Promise<{ ok: true } | { error: string }> {
  const supabase = await requireUser();

  const { data: existing, error: findError } = await supabase
    .from("objects")
    .select("properties")
    .eq("id", id)
    .eq("type", "business")
    .maybeSingle();
  if (findError || !existing) return { error: findError?.message ?? "Business not found" };

  const merged = { ...(existing.properties as Record<string, string>), ...fields };
  const { error } = await supabase.from("objects").update({ properties: merged }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/objects/${id}`);
  return { ok: true };
}
