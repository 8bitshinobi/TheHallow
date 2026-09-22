import { createClient } from "@/lib/supabase/server";
import { mapRow, type ObjectRouteConfig } from "@/lib/api/objectRoute";

/**
 * The in-app "established" pool for a generator (taverns, businesses, NPCs):
 * everything of the given type, through the logged-in session, EXCLUDING
 * anything marked properties.visibility = 'private'. This is default-include
 * — unlike the anonymous public API (lib/api/objectRoute.ts GET), which is
 * opt-in via visibility = 'public'. An object with no visibility property at
 * all (the common case) is in this pool but is not publicly readable.
 */
export async function loadEstablishedPool(
  config: Pick<ObjectRouteConfig, "type" | "textFields" | "listFields">,
  filters: Record<string, string | undefined> = {}
): Promise<Record<string, string | string[]>[]> {
  const supabase = await createClient();

  // Postgres's neq/eq treat a NULL comparison as unknown (neither true nor
  // false), so a plain `.neq("properties->>visibility", "private")` would
  // silently exclude every object with no visibility property at all — the
  // common case, and exactly what "default-include" needs to keep. Select
  // everything of this type instead and filter visibility client-side.
  let query = supabase
    .from("objects")
    .select("id, name, properties")
    .eq("type", config.type)
    .order("name");

  for (const [key, value] of Object.entries(filters)) {
    if (value) query = query.eq(`properties->>${key}`, value);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => (row.properties as Record<string, string> | null)?.visibility !== "private")
    .map((row) => mapRow(config, row, { stripMentions: false }));
}
