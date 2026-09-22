"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
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
    // Unlike the anonymous public API (app/api/businesses/route.ts), this
    // in-app pool is GM-only, so it's fine to also surface the real
    // GM-only front here.
    "front_for",
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
