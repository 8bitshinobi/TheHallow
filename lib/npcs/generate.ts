import { pick } from "@/lib/generatorShared";
import {
  ANCESTRIES,
  APPEARANCE_HEIGHTS,
  APPEARANCE_TRAITS,
  BEAST_ORIGINS,
  BOND_FILLER_NAMES,
  BOND_TEMPLATES,
  DRACONIC_ORIGINS,
  FALLEN_CHANCE,
  FIENDISH_ORIGINS,
  FLAWS,
  IDEALS,
  MOTIVATIONS,
  NAME_FIRST,
  NAME_LAST,
  OCCUPATIONS,
  OCCUPATION_TYPES,
  PERSONALITY_QUIRKS,
  PERSONALITY_TRAITS,
  REDEEMED_CHANCE,
  type OccupationType,
} from "./tables";

export type NpcCandidate = { id: string; name: string };

/** The flavor-only fields shared by the standalone generator and the in-place button. */
export type NpcFlavor = {
  name: string;
  /** DC20 ancestry, formatted for display — e.g. "Beastborn (Wolf)", "Fiendborn (Umbral, Redeemed)". */
  ancestry: string;
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
  | "ancestry"
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

/**
 * DC20's 15-ancestry list, with the sub-rolls the rules require for a few of
 * them: Beastborn gets a Beast Origin, Dragonborn a Draconic Origin, Fiendborn
 * always gets a Fiendish Origin plus a small chance of being "Redeemed", and
 * Angelborn gets a mirrored small chance of being "Fallen".
 */
function generateAncestry(): string {
  const ancestry = pick(ANCESTRIES);
  switch (ancestry) {
    case "Beastborn":
      return `Beastborn (${pick(BEAST_ORIGINS)})`;
    case "Dragonborn":
      return `Dragonborn (${pick(DRACONIC_ORIGINS)})`;
    case "Fiendborn": {
      const origin = pick(FIENDISH_ORIGINS);
      const redeemed = Math.random() < REDEEMED_CHANCE;
      return `Fiendborn (${origin}${redeemed ? ", Redeemed" : ""})`;
    }
    case "Angelborn":
      return Math.random() < FALLEN_CHANCE ? "Angelborn (Fallen)" : "Angelborn";
    default:
      return ancestry;
  }
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
    ancestry: generateAncestry(),
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
    case "ancestry":
      return { ...card, ancestry: generateAncestry() };
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
