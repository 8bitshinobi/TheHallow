/**
 * PLACEHOLDER NPC generator content — generic fantasy filler, not Hallow
 * canon. Edit freely.
 */

/**
 * DC20's 15-ancestry list — this one is rules content, not placeholder
 * filler (per CLAUDE.md, DC20 and Hallow-world content are separate pools).
 */
export const ANCESTRIES = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Orc",
  "Dragonborn",
  "Giantborn",
  "Angelborn",
  "Fiendborn",
  "Beastborn",
  "Gremlin",
  "Goblin",
  "Terraborn",
  "Shadowborn",
] as const;
export type Ancestry = (typeof ANCESTRIES)[number];

/**
 * Ancestry weights for the random roll: Human, Elf and Dwarf come up 3x as
 * often as the other 12 (each of those 12 stays equally likely to each
 * other). Adjust these numbers to retune the mix.
 */
const COMMON_ANCESTRIES: Ancestry[] = ["Human", "Elf", "Dwarf"];
const COMMON_WEIGHT = 3;
const DEFAULT_WEIGHT = 1;

export const WEIGHTED_ANCESTRIES: readonly (readonly [Ancestry, number])[] = ANCESTRIES.map(
  (ancestry) => [ancestry, COMMON_ANCESTRIES.includes(ancestry) ? COMMON_WEIGHT : DEFAULT_WEIGHT] as const
);

/** Beastborn's Beast Origin: the rulebook's 6 named examples, plus basic real-world animals (no insects) extending the same category. */
export const BEAST_ORIGINS = [
  "Frog", "Elephant", "Lion", "Spider", "Rabbit", "Dog",
  "Cat", "Wolf", "Bear", "Fox", "Horse", "Owl",
  "Hawk", "Snake", "Turtle", "Boar", "Goat", "Deer", "Rat", "Crow",
];

/** Dragonborn's Draconic Origin: Elemental or Mystic, picked as one flat list of 8. */
export const DRACONIC_ORIGINS = [
  "Cold", "Corrosion", "Fire", "Lightning", "Poison", // Elemental
  "Psychic", "Radiant", "Umbral", // Mystic
];

/** Fiendborn's Fiendish Origin — always rolled (not optional). */
export const FIENDISH_ORIGINS = ["Cold", "Corrosion", "Fire", "Poison", "Umbral"];

/** Chance a Fiendborn is also "Redeemed" — a lore twist, not a coin flip. */
export const REDEEMED_CHANCE = 0.12;
/** Chance an Angelborn is also "Fallen" — same idea, mirrored. */
export const FALLEN_CHANCE = 0.12;

export const OCCUPATION_TYPES = [
  "Hospitality",
  "Craft",
  "Merchant/Trade",
  "Labor/Farming",
  "Scholar/Healer",
  "Guard/Military",
  "Criminal",
  "Official/Noble",
  "Religious",
] as const;
export type OccupationType = (typeof OCCUPATION_TYPES)[number];

export const OCCUPATIONS: Record<OccupationType, string[]> = {
  Hospitality: ["Innkeeper", "Server", "Cook", "Stable-hand", "Bathhouse attendant"],
  Craft: ["Blacksmith", "Tailor", "Jeweler", "Carpenter", "Cooper"],
  "Merchant/Trade": ["Shopkeeper", "Trader", "Peddler", "Importer", "Vintner"],
  "Labor/Farming": ["Farmhand", "Dockhand", "Miner", "Fisher", "Woodcutter"],
  "Scholar/Healer": ["Apothecary", "Scribe", "Physician", "Herbalist", "Bookseller"],
  "Guard/Military": ["Guard", "Soldier", "Mercenary", "Watch captain", "Sentry"],
  Criminal: ["Pickpocket", "Fence", "Smuggler", "Con artist", "Enforcer"],
  "Official/Noble": ["Clerk", "Reeve", "Tax collector", "Noble", "Diplomat"],
  Religious: ["Priest", "Acolyte", "Oracle", "Gravedigger", "Pilgrim"],
};

export const NAME_FIRST = [
  "Alda", "Brannoch", "Corvin", "Dessa", "Edrin", "Fenna", "Garrick", "Hilde",
  "Ismay", "Jorund", "Kestrel", "Lorna", "Marek", "Nessa", "Orrin", "Pell",
  "Quenna", "Rooke", "Sable", "Tamsin",
];

export const NAME_LAST = [
  "Ashby", "Barleycorn", "Coldwater", "Dunmore", "Fairweather", "Greaves",
  "Harrow", "Ironside", "Kettleby", "Longstride", "Marsh", "Thistle",
  "Underhill", "Vance", "Winters",
];

export const APPEARANCE_TRAITS = [
  "a jagged scar across one eyebrow", "unusually pale eyes", "calloused hands",
  "a gap-toothed grin", "hair kept in a tight braid", "ink-stained fingers",
  "a limp, favoring the left leg", "an easy, crooked smile", "close-cropped gray hair",
  "a nose broken more than once", "sun-weathered skin", "a soft, deliberate voice",
  "wiry and quick", "broad-shouldered and slow-moving", "a missing fingertip",
  "a faded tattoo on one forearm",
];

export const APPEARANCE_HEIGHTS = ["short and stocky", "tall and lean", "average height, unremarkable build", "small and quick", "tall and broad"];

export const PERSONALITY_TRAITS = [
  "blunt", "warm", "suspicious", "cheerful", "tired", "meticulous",
  "restless", "quiet", "boastful", "kind", "gruff", "anxious",
];

export const PERSONALITY_QUIRKS = [
  "taps their fingers when thinking", "never makes eye contact for long",
  "collects small trinkets from everyone they meet", "hums without noticing",
  "repeats the last thing you said back to you", "always offers a drink first",
  "counts things under their breath", "flinches at loud noises",
  "insists on shaking hands twice", "keeps a lucky coin they won't spend",
];

export const IDEALS = [
  "Family comes before anything else.",
  "A deal is a deal, once made.",
  "Everyone deserves a second chance.",
  "The law exists to protect people, not power.",
  "Hard work is its own reward.",
  "Nothing is owed to anyone; you take what you earn.",
  "Loyalty above all else.",
  "The truth matters more than comfort.",
  "Beauty and craft are worth preserving.",
  "Faith will see you through anything.",
];

export const FLAWS = [
  "Can't resist a good rumor, true or not.",
  "Holds a grudge long after it stops mattering.",
  "Spends money as fast as it comes in.",
  "Too trusting of anyone who flatters them.",
  "Drinks more than they should.",
  "Can't admit when they're wrong.",
  "Terrified of a specific, oddly small thing.",
  "Says yes to too many favors.",
  "Quick to anger, slow to apologize.",
  "Keeps secrets that aren't theirs to keep.",
];

export const MOTIVATIONS = [
  "Trying to pay off a debt before it comes due.",
  "Looking for a missing family member.",
  "Wants to leave town for good, but hasn't found a way yet.",
  "Trying to prove themselves to someone who doubts them.",
  "Saving up for a specific, expensive goal.",
  "Wants revenge on someone who wronged them long ago.",
  "Trying to keep a secret from getting out.",
  "Hoping to be recognized for work no one's noticed yet.",
  "Wants to settle down after years of moving around.",
  "Chasing a rumor that could change their fortunes.",
];

/** Freeform bond templates; {name} is a plain name for text-only bonds. */
export const BOND_TEMPLATES = [
  "Owes a debt to {name}.",
  "Distrusts {name} for reasons never fully explained.",
  "Would do almost anything for {name}.",
  "Used to work with {name}, before a falling out.",
  "Quietly in love with {name}.",
  "Related to {name}, though rarely mentions it.",
  "Was once saved by {name} and hasn't forgotten it.",
  "Suspects {name} is hiding something.",
];

/** Names used to fill a bond template when no real NPC is linked. */
export const BOND_FILLER_NAMES = [
  "a merchant who passed through years ago",
  "an old friend from another town",
  "a rival from way back",
  "someone they've never named",
  "a sibling nobody else has met",
  "a stranger who left as suddenly as they arrived",
];
