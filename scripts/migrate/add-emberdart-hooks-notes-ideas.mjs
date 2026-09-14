import { getAdminClient, findOrCreateObject, linkObjects } from "./lib.mjs";

const supabase = getAdminClient();

const emberdart = await findOrCreateObject(supabase, "creature", "Emberdart", {});

// --- Adventure hooks (from the Emberdart PDF's "Expand Play-by-Play Hooks") ---

const hooks = [
  {
    name: "The Withering Grove",
    hook_type: "Environmental crisis",
    description:
      "The party discovers a once-vibrant fire-grove now choked by ash. An Emberdart appears only when a druid performs a \"flame-kiss\" ritual, guiding the PCs to the hidden nest that can reignite the grove.",
  },
  {
    name: "The Smoldering Artifact",
    hook_type: "Treasure hunt",
    description:
      "A legendary phoenix-feather amulet is said to be forged from Emberdart plumage. The PCs must earn the trust of a flock by protecting a nest from poachers.",
  },
  {
    name: "Leyline Disruption",
    hook_type: "Mystical mystery",
    description:
      "A leyline crossing is destabilized, causing wildfires. An Emberdart's frantic \"Sun-Drunk Frenzy\" signals the exact spot where the leyline node needs sealing.",
  },
  {
    name: "Music of the Flames",
    hook_type: "Social/role-play",
    description:
      "A traveling bard's lute accidentally summons a nearby Emberdart. The creature becomes entranced, allowing the party to negotiate safe passage through a dangerous volcanic pass.",
  },
];

for (const hook of hooks) {
  const id = await findOrCreateObject(supabase, "adventure_hook", hook.name, {
    hook_type: hook.hook_type,
    description: hook.description,
    source: "Emberdart.pdf",
  });
  await linkObjects(supabase, emberdart, id, "adventure hook");
}

// --- Idea seeds (from the PDF's "Future Expansion Ideas") ---

const ideaSeeds = [
  {
    name: "Storm-charged Emberdart",
    concept: "Variant subspecies",
    description:
      "A variant subspecies that adds lightning damage to its trail, useful for coastal volcanic islands.",
  },
  {
    name: "Cult of the Emberdart",
    concept: "Faction",
    description:
      "A small fey cult that worships the creature as a messenger of the Summer Court; they could provide quests or sell harvested flamefeathers.",
  },
  {
    name: "Obsidian Hawk",
    concept: "Cross-ecology predator",
    description:
      "A predator that hunts Emberdarts, creating a natural food chain and additional encounter options.",
  },
];

for (const seed of ideaSeeds) {
  const id = await findOrCreateObject(supabase, "idea_seed", seed.name, {
    concept: seed.concept,
    description: seed.description,
    source: "Emberdart.pdf",
  });
  await linkObjects(supabase, emberdart, id, "idea seed");
}

// --- Production notes (from the PDF's "Notes / From Lumo" section) ---
// AI-assistant suggestions about presentation/mechanics, not in-world lore —
// kept as its own type so it's easy to filter away from canon content.

const productionNotes = await findOrCreateObject(
  supabase,
  "production_notes",
  "Emberdart Presentation Notes (From Lumo)",
  {
    author: "Lumo (AI writing assistant)",
    source: "Emberdart.pdf",
    text:
      "STREAMLINE THE STAT-BLOCK: A compact block is easier for a DM to read at the table, especially with several special abilities. Suggested format — Tiny Fey (not \"Small Fey\", since its dimensions are clearly tiny), Neutral Good, AC 13 (natural armor), HP 7 (2d4+2), Speed Fly 30 ft. hover, Str 6 Dex 16 Con 12 Int 4 Wis 12 Cha 8, Saves Dex +5/Con +3, Skills Perception +3/Stealth +5/Nature +2, Resistances Fire, Senses Darkvision 60 ft. + Infrared Vision (sees heat signatures), Languages understands Sylvan (communicates via Speak with Animals), Challenge 1/4 (50 XP). List traits/abilities in bullet form with a concise trigger and effect: Flame Flutter (10-ft. line of embers, DC 12 Dex save or 1d4 fire damage, fades at the start of its next turn); Ignite Nectar (bonus action, short-rest recharge, regain 1d4 HP within 5 ft. of a fire-aligned plant/heat source); Radiant Evasion (reaction, teleport up to 10 ft. when hit/targeted, vacated space gives the attacker disadvantage); Solar Pulse (rare/optional — during a solar event or leyline bloom, speed increases to 40 ft. and it sheds bright light in a 20-ft. radius; on death, releases a harmless pulse that sprouts rare flora in a 10-ft. radius).\n\n" +
      "ADD AN ECOLOGY SIDEBAR: A quick DM reference placed right after the taxonomy or before the stat block — primary pollinator of Ashpetal Bloom & Kindlegrass; acts as a \"controlled wildfire\" agent clearing dead matter and fostering mana-rich soil; nesting sites are fire-bark trees, cinderglass nests, phoenix-down lining; seasonal Solstice-Bloom courtship where the \"spiral dance\" triggers mass blooming; rare trait Phoenix Pulse, a death-burst that spawns rare plants.\n\n" +
      "ADVENTURE HOOKS: Concrete adventure seeds so DMs can drop the Emberdart into a session — see the four linked adventure_hook objects (The Withering Grove, The Smoldering Artifact, Leyline Disruption, Music of the Flames). These can be dropped as side-quests or woven into larger arcs.\n\n" +
      "CLARIFY RARE ABILITIES FOR BALANCE: To keep the creature at CR 1/4 — Solar Pulse should trigger at most once per day, and only when the sun is at its zenith or a leyline is active (DM's call); the death-burst should stay a harmless narrative bloom, not deal damage or grant bonus experience, to avoid accidental power spikes. For a more threatening CR 1/2 version, Solar Pulse could increase speed to 50 ft. and add a blinding flash (DC 13 Constitution save or blinded until the end of its next turn).\n\n" +
      "MINOR FORMATTING TWEAKS: Use a single consistent heading style for major sections (Taxonomy, Description, Ecology, Mechanics, Lore); bold ability names only, not entire paragraphs; write temperatures in both Fahrenheit and Celsius for international players (e.g. \">120°F / 49°C\"); render the Rollable Knowledge Table as an actual markdown table since it's quicker to scan.\n\n" +
      "FUTURE EXPANSION IDEAS: See the three linked idea_seed objects — Storm-charged Emberdart (variant subspecies adding lightning damage, for coastal volcanic islands), Cult of the Emberdart (a small fey cult worshipping it as a Summer Court messenger, useful for quests or selling harvested flamefeathers), and Obsidian Hawk (a predator that hunts Emberdarts, creating a natural food chain and more encounter options).\n\n" +
      "QUICK RECAP: Condense the stat-block to a tabletop-friendly format; offer a one-glance ecology sidebar; provide ready-to-use adventure hooks; define clear limits for rare abilities; keep formatting consistent and readable; leave room for future variants, factions, and ecological relationships.",
  }
);
await linkObjects(supabase, emberdart, productionNotes, "production notes");

console.log("\nDone: adventure hooks, idea seeds, and production notes added for Emberdart.");
