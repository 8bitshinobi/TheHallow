import { pick } from "@/lib/generatorShared";
import {
  APPEARANCE_HEIGHTS,
  APPEARANCE_TRAITS,
  BOND_FILLER_NAMES,
  BOND_TEMPLATES,
  FLAWS,
  IDEALS,
  MOTIVATIONS,
  NAME_FIRST,
  NAME_LAST,
  OCCUPATIONS,
  OCCUPATION_TYPES,
  PERSONALITY_QUIRKS,
  PERSONALITY_TRAITS,
  type OccupationType,
} from "./tables";

export type NpcCandidate = { id: string; name: string };

/** The flavor-only fields shared by the standalone generator and the in-place button. */
export type NpcFlavor = {
  name: string;
  description: string;
  personality: string;
  ideals: string;
  flaws: string;
  /** May contain an "@[Name](id)" mention of a real NPC. */
  bonds: string;
  motivation: string;
};

export type NpcCard = NpcFlavor & {
  /** True when this is a real, existing NPC from the archive. */
  established: boolean;
  id?: string;
  icon?: string;
  occupationType?: OccupationType;
  occupation: string;
  location: string;
  locationId?: string;
};

export type NpcContext = {
  occupationType: OccupationType | "Any";
  location: { id: string; name: string } | null;
  /** Real NPCs a generated bond can link to (the in-app pool, minus this NPC if editing one). */
  npcCandidates: NpcCandidate[];
};

export type NpcRerollField =
  | "name"
  | "description"
  | "personality"
  | "ideals"
  | "flaws"
  | "bonds"
  | "motivation"
  | "occupation";

function generateName(): string {
  return `${pick(NAME_FIRST)} ${pick(NAME_LAST)}`;
}

function generateDescription(): string {
  return `${pick(APPEARANCE_HEIGHTS)}, ${pick(APPEARANCE_TRAITS)}.`;
}

function generatePersonality(): string {
  return `${pick(PERSONALITY_TRAITS).replace(/^./, (c) => c.toUpperCase())}. ${pick(
    PERSONALITY_QUIRKS
  ).replace(/^./, (c) => c.toUpperCase())}.`;
}

/** About half of generated bonds link a real NPC (if any exist), via a mention. */
function generateBonds(candidates: NpcCandidate[]): string {
  const template = pick(BOND_TEMPLATES);
  if (candidates.length > 0 && Math.random() < 0.5) {
    const target = pick(candidates);
    return template.replace("{name}", `@[${target.name}](${target.id})`);
  }
  return template.replace("{name}", pick(BOND_FILLER_NAMES));
}

function occupationFor(occupationType: OccupationType | "Any"): {
  occupationType: OccupationType;
  occupation: string;
} {
  const type = occupationType === "Any" ? pick(OCCUPATION_TYPES) : occupationType;
  return { occupationType: type, occupation: pick(OCCUPATIONS[type]) };
}

/** The flavor fields alone — shared by the standalone generator and the in-place button. */
export function generateFlavor(candidates: NpcCandidate[]): NpcFlavor {
  return {
    name: generateName(),
    description: generateDescription(),
    personality: generatePersonality(),
    ideals: pick(IDEALS),
    flaws: pick(FLAWS),
    bonds: generateBonds(candidates),
    motivation: pick(MOTIVATIONS),
  };
}

export function generateNpc(context: NpcContext): NpcCard {
  return {
    established: false,
    ...generateFlavor(context.npcCandidates),
    ...occupationFor(context.occupationType),
    location: context.location?.name ?? "",
    locationId: context.location?.id,
  };
}

export function rerollNpcField(card: NpcCard, field: NpcRerollField, context: NpcContext): NpcCard {
  switch (field) {
    case "name":
      return { ...card, name: generateName() };
    case "description":
      return { ...card, description: generateDescription() };
    case "personality":
      return { ...card, personality: generatePersonality() };
    case "ideals":
      return { ...card, ideals: pick(IDEALS) };
    case "flaws":
      return { ...card, flaws: pick(FLAWS) };
    case "bonds":
      return { ...card, bonds: generateBonds(context.npcCandidates) };
    case "motivation":
      return { ...card, motivation: pick(MOTIVATIONS) };
    case "occupation":
      return { ...card, ...occupationFor(card.occupationType ?? "Any") };
  }
}

export { OCCUPATION_TYPES };
