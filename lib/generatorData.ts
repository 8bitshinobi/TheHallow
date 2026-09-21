import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/taverns/generate";

// Object types whose *names* may appear in lore rumors. Only records marked
// visibility=public are used, and only their names — never their properties.
const HOOK_TYPES = ["lore", "events", "organization", "adventure_hook", "region", "place"];

// Places with these categories are settlements, so they count as locations
// alongside regions.
const SETTLEMENT_CATEGORIES = ["town", "city"];

function lines(value: string | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Locations (regions + settlements) and public lore hooks for the generator pages. */
export async function loadGeneratorData(): Promise<{ regions: Region[]; hooks: string[] }> {
  const supabase = await createClient();

  const [locationResult, hookResult] = await Promise.all([
    supabase
      .from("objects")
      .select("id, name, type, properties")
      .or("type.ilike.region,type.ilike.place")
      .order("name"),
    supabase
      .from("objects")
      .select("name")
      .or(HOOK_TYPES.map((type) => `type.ilike.${type}`).join(","))
      .eq("properties->>visibility", "public")
      .order("name"),
  ]);
  if (locationResult.error) throw new Error(locationResult.error.message);
  if (hookResult.error) throw new Error(hookResult.error.message);

  const regions: Region[] = (locationResult.data ?? [])
    .filter((row) => {
      if (row.type.toLowerCase() === "region") return true;
      const category = (row.properties as Record<string, string>)?.category?.trim().toLowerCase();
      return category !== undefined && SETTLEMENT_CATEGORIES.includes(category);
    })
    .map((row) => {
      const props = (row.properties ?? {}) as Record<string, string>;
      return {
        id: row.id,
        name: row.name,
        theme: props.tavern_theme ?? "",
        specialties: lines(props.tavern_specialties),
      };
    });

  return { regions, hooks: (hookResult.data ?? []).map((row) => row.name) };
}
