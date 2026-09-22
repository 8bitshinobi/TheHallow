"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { loadEstablishedPool } from "@/lib/generatorPool";
import { formatMention } from "@/lib/mentions";
import { generateFlavor, type NpcCandidate } from "@/lib/npcs/generate";
import { noviceStatsToProperties, generateNoviceStats } from "@/lib/npcs/dc20";
import { occupationForPlace } from "@/lib/npcs/placeOccupations";

const NPC_CONFIG = {
  type: "NPC",
  textFields: [
    "occupation",
    "occupation_type",
    "description",
    "personality",
    "ideals",
    "flaws",
    "bonds",
    "motivation",
    "icon",
    "location",
  ],
  listFields: [],
} as const;

/** The in-app "established" NPC pool: everything not marked visibility=private. */
export async function getEstablishedNpcs(filters: { location?: string; occupation_type?: string }) {
  return loadEstablishedPool(NPC_CONFIG, filters);
}

/** Real NPCs a generated bond can link to (excludes the NPC currently being edited, if any). */
export async function getNpcCandidates(excludeId?: string): Promise<NpcCandidate[]> {
  const supabase = await requireUser();
  const { data, error } = await supabase.from("objects").select("id, name, properties").eq("type", "NPC");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((row) => (row.properties as Record<string, string> | null)?.visibility !== "private")
    .filter((row) => row.id !== excludeId)
    .map((row) => ({ id: row.id, name: row.name }));
}

/** Saves a standalone-generator NPC card (Part 1) — no mechanical stats. */
export async function saveNpc(card: {
  name: string;
  occupation: string;
  occupationType?: string;
  description: string;
  personality: string;
  ideals: string;
  flaws: string;
  bonds: string;
  motivation: string;
  location?: string;
  locationId?: string;
}): Promise<{ id: string }> {
  const supabase = await requireUser();

  const properties: Record<string, string> = {
    occupation: card.occupation,
    description: card.description,
    personality: card.personality,
    ideals: card.ideals,
    flaws: card.flaws,
    bonds: card.bonds,
    motivation: card.motivation,
    status: "in_development",
    source: "NPC generator",
  };
  if (card.occupationType) properties.occupation_type = card.occupationType;
  if (card.location) properties.location = card.location;

  const { data: created, error } = await supabase
    .from("objects")
    .insert({ type: "NPC", name: card.name, properties })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not save NPC");

  if (card.locationId) {
    await supabase.from("edges").insert({ from_id: created.id, to_id: card.locationId, label: "located in" });
  }

  revalidatePath("/objects");
  return { id: created.id };
}

/**
 * Part 2: the in-place "Generate NPC" button next to a place's innkeeper/
 * proprietor field. Fast and self-contained — generates flavor + Novice-tier
 * DC20 stats (Magazine #3), creates a real NPC object right away (private
 * until the surrounding place is saved links it — same pattern as
 * MentionTextarea's "+ Create" flow), and returns the mention text to drop
 * into the field. Occupation is fixed to the place's type/category; there is
 * no occupation-type selector here.
 */
export async function generateNpcForPlace(input: {
  placeType: string;
  placeCategory?: string;
  placeName?: string;
  /** If the field already had a typed name, keep it instead of generating one. */
  existingName?: string;
}): Promise<{ id: string; name: string; mention: string } | { error: string }> {
  const supabase = await requireUser();

  const mapped = occupationForPlace(input.placeType, input.placeCategory);
  if (!mapped) {
    return { error: "No occupation mapping for this place type/category." };
  }

  const candidates = await getNpcCandidates();
  const flavor = generateFlavor(candidates);
  if (input.existingName?.trim()) flavor.name = input.existingName.trim();
  const stats = generateNoviceStats();

  const properties: Record<string, string> = {
    occupation: mapped.occupation,
    occupation_type: mapped.occupationType,
    description: flavor.description,
    personality: flavor.personality,
    ideals: flavor.ideals,
    flaws: flavor.flaws,
    bonds: flavor.bonds,
    motivation: flavor.motivation,
    status: "in_development",
    source: input.placeName ? `Generated in play at ${input.placeName}` : "Generated in play",
    ...noviceStatsToProperties(stats),
  };

  const { data: created, error } = await supabase
    .from("objects")
    .insert({ type: "NPC", name: flavor.name, properties })
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Could not create NPC" };

  return { id: created.id, name: flavor.name, mention: formatMention(flavor.name, created.id) };
}
