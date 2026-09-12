"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HallowObject } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
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

  revalidatePath(`/objects/${id}`);
  revalidatePath("/objects");
}

export async function deleteObject(id: string) {
  const supabase = await requireUser();

  const { error } = await supabase.from("objects").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/objects");
}

export async function searchObjects(
  query: string,
  excludeId: string
): Promise<Pick<HallowObject, "id" | "type" | "name">[]> {
  const supabase = await requireUser();

  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from("objects")
    .select("id, type, name")
    .ilike("name", `%${query.trim()}%`)
    .neq("id", excludeId)
    .order("name")
    .limit(10);

  if (error) throw new Error(error.message);
  return data ?? [];
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
