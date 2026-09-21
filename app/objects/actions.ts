"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractMentionIds } from "@/lib/mentions";
import { iconFor } from "@/lib/icons";
import type { HallowObject } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

/**
 * Property values may embed "@[Name](id)" mentions (see lib/mentions.ts).
 * Ensures each mentioned object has a real edge to/from this object, so a
 * mention behaves like manually connecting them via ConnectionPicker.
 * Never removes edges - deleting mention text doesn't retract a connection.
 */
async function syncMentionEdges(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objectId: string,
  properties: Record<string, string>
) {
  const targetIds = extractMentionIds(properties).filter((id) => id !== objectId);
  if (targetIds.length === 0) return;

  for (const targetId of targetIds) {
    const { data: existing, error: findError } = await supabase
      .from("edges")
      .select("id")
      .or(
        `and(from_id.eq.${objectId},to_id.eq.${targetId}),and(from_id.eq.${targetId},to_id.eq.${objectId})`
      )
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (existing) continue;

    const { error: insertError } = await supabase
      .from("edges")
      .insert({ from_id: objectId, to_id: targetId, label: null });
    if (insertError) throw new Error(insertError.message);

    revalidatePath(`/objects/${targetId}`);
  }
}

export async function createObject(
  type: string,
  name: string,
  properties: Record<string, string>
): Promise<{ id: string }> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("objects")
    .insert({ type: type.trim(), name: name.trim(), properties })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (properties) await syncMentionEdges(supabase, data.id, properties);

  revalidatePath("/objects");
  return { id: data.id };
}

export async function updateObject(
  id: string,
  fields: { name?: string; properties?: Record<string, string> }
) {
  const supabase = await requireUser();

  const { error } = await supabase.from("objects").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  if (fields.properties) await syncMentionEdges(supabase, id, fields.properties);

  revalidatePath(`/objects/${id}`);
  revalidatePath("/objects");
}

export async function deleteObject(id: string) {
  const supabase = await requireUser();

  const { error } = await supabase.from("objects").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/objects");
}

export async function listTypes(): Promise<string[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase.from("objects").select("type");
  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((row) => row.type.trim()))).sort();
}

export async function searchObjects(
  query: string,
  excludeId?: string
): Promise<(Pick<HallowObject, "id" | "type" | "name"> & { icon: string })[]> {
  const supabase = await requireUser();

  if (!query.trim()) return [];

  let dbQuery = supabase
    .from("objects")
    .select("id, type, name, properties")
    .ilike("name", `%${query.trim()}%`)
    .order("name")
    .limit(10);

  if (excludeId) dbQuery = dbQuery.neq("id", excludeId);

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    icon: iconFor(row.type, row.properties),
  }));
}

export async function createEdge(
  fromId: string,
  toId: string,
  label: string | null
) {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("edges")
    .insert({ from_id: fromId, to_id: toId, label: label?.trim() || null });

  if (error) throw new Error(error.message);

  revalidatePath(`/objects/${fromId}`);
  revalidatePath(`/objects/${toId}`);
}

export async function deleteEdge(edgeId: string, refreshObjectId: string) {
  const supabase = await requireUser();

  const { error } = await supabase.from("edges").delete().eq("id", edgeId);
  if (error) throw new Error(error.message);

  revalidatePath(`/objects/${refreshObjectId}`);
}
