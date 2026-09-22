"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
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
    "patron_crowd",
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

/**
 * Writes freshly-rolled values for specific blank fields into a real,
 * already-existing tavern (see fillEstablishedTavernBlanks / the "rolled"
 * tags in the UI). Merges into the object's current properties — re-read
 * fresh here, not trusted from the client — rather than replacing them
 * wholesale, so nothing else on the object is touched.
 */
export async function saveRolledTavernFields(
  id: string,
  fields: Record<string, string>
): Promise<{ ok: true } | { error: string }> {
  const supabase = await requireUser();

  const { data: existing, error: findError } = await supabase
    .from("objects")
    .select("properties")
    .eq("id", id)
    .eq("type", "tavern")
    .maybeSingle();
  if (findError || !existing) return { error: findError?.message ?? "Tavern not found" };

  const merged = { ...(existing.properties as Record<string, string>), ...fields };
  const { error } = await supabase.from("objects").update({ properties: merged }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/objects/${id}`);
  return { ok: true };
}
