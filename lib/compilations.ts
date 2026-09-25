import { createClient } from "@/lib/supabase/server";
import { iconFor } from "@/lib/icons";
import type { CompilationEntry, HallowObject } from "@/lib/types";

export async function listCompilations(): Promise<HallowObject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objects")
    .select("*")
    .ilike("type", "compilation")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

type EntryRow = {
  id: string;
  compilation_id: string;
  object_id: string;
  status: CompilationEntry["status"];
  position: number | null;
  rough_era: string | null;
  created_at: string;
  updated_at: string;
  objects: { id: string; type: string; name: string; properties: Record<string, string> } | null;
};

function toEntry(row: EntryRow): CompilationEntry | null {
  if (!row.objects) return null;
  return {
    id: row.id,
    compilation_id: row.compilation_id,
    object_id: row.object_id,
    status: row.status,
    position: row.position,
    rough_era: row.rough_era,
    created_at: row.created_at,
    updated_at: row.updated_at,
    object: {
      id: row.objects.id,
      type: row.objects.type,
      name: row.objects.name,
      properties: row.objects.properties,
      icon: iconFor(row.objects.type, row.objects.properties),
    },
  };
}

/** All entries for a compilation, split by lifecycle. Placed entries are ordered by position. */
export async function getCompilationEntries(compilationId: string): Promise<{
  draft: CompilationEntry[];
  placed: CompilationEntry[];
  cut: CompilationEntry[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compilation_entries")
    .select(
      "id, compilation_id, object_id, status, position, rough_era, created_at, updated_at, objects:object_id (id, type, name, properties)"
    )
    .eq("compilation_id", compilationId);

  if (error) throw new Error(error.message);

  const entries = ((data ?? []) as unknown as EntryRow[])
    .map(toEntry)
    .filter((e): e is CompilationEntry => e !== null);

  return {
    draft: entries
      .filter((e) => e.status === "draft")
      .sort((a, b) => a.object.name.localeCompare(b.object.name)),
    placed: entries
      .filter((e) => e.status === "placed")
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    cut: entries
      .filter((e) => e.status === "cut")
      .sort((a, b) => a.object.name.localeCompare(b.object.name)),
  };
}

export async function listArcs(): Promise<HallowObject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objects")
    .select("*")
    .ilike("type", "arc")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}
