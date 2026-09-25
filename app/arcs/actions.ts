"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export async function createArc(name: string): Promise<{ id: string }> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("objects")
    .insert({ type: "arc", name: name.trim(), properties: {} })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/arcs");
  return { id: data.id };
}

/** Creates a new plot_beat object and links it to the given arc in one step. */
export async function createPlotBeatInArc(
  arcId: string,
  name: string
): Promise<{ id: string }> {
  const supabase = await requireUser();

  const { data: beat, error: beatError } = await supabase
    .from("objects")
    .insert({ type: "plot_beat", name: name.trim(), properties: {} })
    .select("id")
    .single();

  if (beatError) throw new Error(beatError.message);

  const { error: edgeError } = await supabase
    .from("edges")
    .insert({ from_id: arcId, to_id: beat.id, label: "part of" });

  if (edgeError) throw new Error(edgeError.message);

  revalidatePath(`/arcs/${arcId}`);
  revalidatePath(`/objects/${arcId}`);
  return { id: beat.id };
}
