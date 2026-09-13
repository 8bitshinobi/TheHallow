import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Run with: node --env-file=.env.local scripts/migrate/<file>.mjs"
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Finds an object by (type, name); creates it if missing. If it already
 * exists, merges any newly-provided properties into it (existing values win
 * on key conflicts) so re-running a migration script is safe.
 */
export async function findOrCreateObject(supabase, type, name, properties = {}) {
  const { data: existing, error: findError } = await supabase
    .from("objects")
    .select("id, properties")
    .eq("type", type)
    .eq("name", name)
    .maybeSingle();

  if (findError) throw new Error(findError.message);

  if (existing) {
    const merged = { ...properties, ...existing.properties };
    const { error } = await supabase
      .from("objects")
      .update({ properties: merged })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    console.log(`= found existing ${type} "${name}"`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("objects")
    .insert({ type, name, properties })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  console.log(`+ created ${type} "${name}"`);
  return data.id;
}

/** Creates an edge if an equivalent one doesn't already exist. */
export async function linkObjects(supabase, fromId, toId, label = null) {
  let query = supabase
    .from("edges")
    .select("id")
    .eq("from_id", fromId)
    .eq("to_id", toId);
  query = label === null ? query.is("label", null) : query.eq("label", label);

  const { data: existing, error: findError } = await query.maybeSingle();
  if (findError) throw new Error(findError.message);
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("edges")
    .insert({ from_id: fromId, to_id: toId, label })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  console.log(`  linked (${label ?? "no label"})`);
  return data.id;
}
