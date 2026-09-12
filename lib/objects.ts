import { createClient } from "@/lib/supabase/server";
import type { ConnectedObject, HallowObject } from "@/lib/types";

export async function listObjects(typeFilter?: string): Promise<HallowObject[]> {
  const supabase = await createClient();
  let query = supabase.from("objects").select("*").order("name");

  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listObjectTypes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("objects").select("type");
  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((row) => row.type))).sort();
}

export async function getObject(id: string): Promise<HallowObject | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getOutgoingConnections(
  id: string
): Promise<ConnectedObject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("edges")
    .select("id, label, to_id, objects:to_id (id, type, name)")
    .eq("from_id", id);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.objects)
    .map((row) => ({
      edgeId: row.id,
      label: row.label,
      object: row.objects as unknown as ConnectedObject["object"],
    }));
}

export async function getIncomingConnections(
  id: string
): Promise<ConnectedObject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("edges")
    .select("id, label, from_id, objects:from_id (id, type, name)")
    .eq("to_id", id);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.objects)
    .map((row) => ({
      edgeId: row.id,
      label: row.label,
      object: row.objects as unknown as ConnectedObject["object"],
    }));
}
