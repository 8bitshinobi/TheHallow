import { TavernGenerator } from "@/components/TavernGenerator";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/taverns/generate";

// Object types whose *names* may appear in lore rumors. Only records marked
// visibility=public are used, and only their names — never their properties.
const HOOK_TYPES = ["lore", "events", "organization", "adventure_hook", "region", "place"];

export default async function TavernsPage() {
  const supabase = await createClient();

  const [regionResult, hookResult] = await Promise.all([
    supabase.from("objects").select("id, name, properties").ilike("type", "region").order("name"),
    supabase
      .from("objects")
      .select("name")
      .or(HOOK_TYPES.map((type) => `type.ilike.${type}`).join(","))
      .eq("properties->>visibility", "public")
      .order("name"),
  ]);
  if (regionResult.error) throw new Error(regionResult.error.message);
  if (hookResult.error) throw new Error(hookResult.error.message);

  const regions: Region[] = (regionResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    theme: (row.properties as Record<string, string>)?.tavern_theme ?? "",
    specialties: ((row.properties as Record<string, string>)?.tavern_specialties ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  }));
  const hooks = (hookResult.data ?? []).map((row) => row.name);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Tavern &amp; Inn Generator</h1>
      <TavernGenerator regions={regions} hooks={hooks} />
    </div>
  );
}
