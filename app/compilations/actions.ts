"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { buildCompilationRtf } from "@/lib/rtf";

function refresh(compilationId: string) {
  revalidatePath(`/compilations/${compilationId}`);
  revalidatePath("/compilations");
}

export async function createCompilation(name: string): Promise<{ id: string }> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("objects")
    .insert({ type: "compilation", name: name.trim(), properties: {} })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/compilations");
  return { id: data.id };
}

export async function addEntryToCompilation(compilationId: string, objectId: string) {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("compilation_entries")
    .insert({ compilation_id: compilationId, object_id: objectId, status: "draft" });

  if (error) {
    if (error.code === "23505") throw new Error("That object is already in this compilation.");
    throw new Error(error.message);
  }

  refresh(compilationId);
}

export async function setEntryRoughEra(entryId: string, compilationId: string, roughEra: string) {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("compilation_entries")
    .update({ rough_era: roughEra.trim() || null })
    .eq("id", entryId);

  if (error) throw new Error(error.message);

  refresh(compilationId);
}

export async function placeEntry(entryId: string, compilationId: string) {
  const supabase = await requireUser();

  const { data: placed, error: placedError } = await supabase
    .from("compilation_entries")
    .select("position")
    .eq("compilation_id", compilationId)
    .eq("status", "placed")
    .order("position", { ascending: false })
    .limit(1);

  if (placedError) throw new Error(placedError.message);

  const nextPosition = (placed?.[0]?.position ?? 0) + 1;

  const { error } = await supabase
    .from("compilation_entries")
    .update({ status: "placed", position: nextPosition })
    .eq("id", entryId);

  if (error) throw new Error(error.message);

  refresh(compilationId);
}

async function movePlacedEntry(entryId: string, compilationId: string, direction: "up" | "down") {
  const supabase = await requireUser();

  const { data: ordered, error } = await supabase
    .from("compilation_entries")
    .select("id, position")
    .eq("compilation_id", compilationId)
    .eq("status", "placed")
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);

  const list = ordered ?? [];
  const index = list.findIndex((row) => row.id === entryId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;

  const current = list[index];
  const swapWith = list[swapIndex];

  const first = await supabase
    .from("compilation_entries")
    .update({ position: swapWith.position })
    .eq("id", current.id);
  if (first.error) throw new Error(first.error.message);

  const second = await supabase
    .from("compilation_entries")
    .update({ position: current.position })
    .eq("id", swapWith.id);
  if (second.error) throw new Error(second.error.message);

  refresh(compilationId);
}

export async function moveEntryUp(entryId: string, compilationId: string) {
  await movePlacedEntry(entryId, compilationId, "up");
}

export async function moveEntryDown(entryId: string, compilationId: string) {
  await movePlacedEntry(entryId, compilationId, "down");
}

export async function cutEntry(entryId: string, compilationId: string) {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("compilation_entries")
    .update({ status: "cut", position: null })
    .eq("id", entryId);

  if (error) throw new Error(error.message);

  refresh(compilationId);
}

export async function restoreEntryToDraft(entryId: string, compilationId: string) {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("compilation_entries")
    .update({ status: "draft", position: null })
    .eq("id", entryId);

  if (error) throw new Error(error.message);

  refresh(compilationId);
}

export async function removeEntry(entryId: string, compilationId: string) {
  const supabase = await requireUser();

  const { error } = await supabase.from("compilation_entries").delete().eq("id", entryId);
  if (error) throw new Error(error.message);

  refresh(compilationId);
}

export async function exportCompilationRtf(
  compilationId: string
): Promise<{ filename: string; content: string }> {
  const supabase = await requireUser();

  const { data: compilation, error: compilationError } = await supabase
    .from("objects")
    .select("name")
    .eq("id", compilationId)
    .single();
  if (compilationError) throw new Error(compilationError.message);

  const { data: rows, error } = await supabase
    .from("compilation_entries")
    .select("position, objects:object_id (name, properties)")
    .eq("compilation_id", compilationId)
    .eq("status", "placed")
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);

  const entries = ((rows ?? []) as unknown as {
    position: number | null;
    objects: { name: string; properties: Record<string, string> } | null;
  }[])
    .filter((row) => row.objects)
    .map((row) => ({
      title: row.objects!.properties?.title?.trim() || row.objects!.name,
      narrativeText: row.objects!.properties?.narrative_text ?? "",
    }));

  const content = buildCompilationRtf(entries);
  const filename = `${compilation.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "compilation"}.rtf`;

  return { filename, content };
}
