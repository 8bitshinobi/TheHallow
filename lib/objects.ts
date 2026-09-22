import { createClient } from "@/lib/supabase/server";
import { fallbackGraphLabel } from "@/lib/graphLabel";
import { iconFor } from "@/lib/icons";
import type { ConnectedObject, Graph, GraphNode, HallowObject } from "@/lib/types";

export async function listObjects(typeFilter?: string): Promise<HallowObject[]> {
  const supabase = await createClient();
  let query = supabase.from("objects").select("*").order("name");

  if (typeFilter) {
    query = query.ilike("type", typeFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listObjectTypes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("objects").select("type");
  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((row) => row.type.trim()))).sort();
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

function toGraphObject(row: {
  id: string;
  type: string;
  name: string;
  properties: Record<string, string> | null;
}): ConnectedObject["object"] {
  const explicit = row.properties?.label?.trim();
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    graphLabel: explicit || fallbackGraphLabel(row.name),
    icon: iconFor(row.type, row.properties),
  };
}

export async function getOutgoingConnections(
  id: string
): Promise<ConnectedObject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("edges")
    .select("id, label, to_id, objects:to_id (id, type, name, properties)")
    .eq("from_id", id);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.objects)
    .map((row) => ({
      edgeId: row.id,
      label: row.label,
      object: toGraphObject(row.objects as unknown as Parameters<typeof toGraphObject>[0]),
    }));
}

export function buildNeighborhoodGraph(
  center: HallowObject,
  outgoing: ConnectedObject[],
  incoming: ConnectedObject[]
): Graph {
  const nodesById = new Map<string, GraphNode>();
  nodesById.set(center.id, toGraphObject(center));

  for (const connection of [...outgoing, ...incoming]) {
    nodesById.set(connection.object.id, connection.object);
  }

  const edges: Graph["edges"] = [
    ...outgoing.map((c) => ({ id: c.edgeId, from: center.id, to: c.object.id, label: c.label })),
    ...incoming.map((c) => ({ id: c.edgeId, from: c.object.id, to: center.id, label: c.label })),
  ];

  return { nodes: Array.from(nodesById.values()), edges };
}

export async function listAllObjectsLight(): Promise<GraphNode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("objects").select("id, type, name, properties");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toGraphObject);
}

export async function listAllEdges(): Promise<Graph["edges"]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("edges").select("id, from_id, to_id, label");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    from: row.from_id,
    to: row.to_id,
    label: row.label,
  }));
}

export async function getIncomingConnections(
  id: string
): Promise<ConnectedObject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("edges")
    .select("id, label, from_id, objects:from_id (id, type, name, properties)")
    .eq("to_id", id);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.objects)
    .map((row) => ({
      edgeId: row.id,
      label: row.label,
      object: toGraphObject(row.objects as unknown as Parameters<typeof toGraphObject>[0]),
    }));
}
