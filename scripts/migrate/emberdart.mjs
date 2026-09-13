import { getAdminClient, findOrCreateObject, linkObjects } from "./lib.mjs";

const supabase = getAdminClient();

// --- NPCs & organizations (reused across creatures; found-or-created) ------

const rangard = await findOrCreateObject(supabase, "npc", "Rangard Ricker", {
  role: "Field researcher; member of the Triumvirate of Understanding",
  voice: "Blunt, folksy field-log narrator",
});

const succa = await findOrCreateObject(supabase, "npc", "Succa Dogwood", {
  role: "Guardian of Verdancy, Speaker of Sap; botanical field observer",
  voice: "Sharp-tongued, precise, occasionally cutting",
});

const panthy = await findOrCreateObject(supabase, "npc", "Panthy Weatherbee", {
  role: "Curator Emeritus, Chimerical Collection of Radiant Entities",
  voice: "Wry, theatrical museum-placard narrator",
});

const triumvirate = await findOrCreateObject(
  supabase,
  "organization",
  "Triumvirate of Understanding",
  {
    description:
      "Classification body credited (alongside Rangard Ricker) for taxonomic work in the Codex.",
  }
);

// --- Creature ---------------------------------------------------------------

const emberdart = await findOrCreateObject(supabase, "creature", "Emberdart", {
  scientific_name: "Sylas igniculus",
  common_names: "Emberdart, Firepetal Sprite, Cinderbeak",
  codex: "Codex Ferox",
  kingdom: "Arcanae",
  sphere: "Feywild",
  phylum: "Avian",
  order: "Herbicantis Vigilantis",
  family: "Ignavidae",
  genus: "Sylas",
  species: "Igniculus",
  lore_tier: "Tier 1 (Codex)",
  size: "Tiny",
  trainability: "None",
  communication: "Can respond via Speak with Animals or tones",
  lifespan: "8–12 years (may fade into radiant energy if undisturbed)",
  disposition: "Territorial, intense, fleeting",
  habitat: "Flamegroves, volcanic meadows, fey sun-glades",

  description:
    "A hummingbird wreathed in perpetual fire, its wings a blur of ember-light. Emits a gentle crackling sound when hovering. The Emberdart's eyes glow with a golden sheen, and its feathers shimmer in shades of flame and coal.",

  field_guide_summary:
    "A hummingbird wreathed in flame, its wings a blur of ember-light. Emits a crackling sound when hovering. Though dangerous-looking, it is a sacred pollinator of fire-tied flora and a warden of magical groves.",

  cr: "1/4 (50 XP)",

  stat_block:
    "Tiny Fey, Neutral Good\n" +
    "AC 13 (natural armor) | HP 7 (2d4+2) | Speed Fly 30 ft., hover\n" +
    "STR 6 DEX 16 CON 12 INT 4 WIS 12 CHA 8\n" +
    "Saves: Dex +5, Con +3 | Skills: Perception +3, Stealth +5, Nature +2\n" +
    "Resistances: Fire | Senses: Darkvision 60 ft., Infrared Vision (sees heat signatures) | Languages: understands Sylvan\n" +
    "CR 1/4 (50 XP)",

  abilities:
    "Flame Flutter — as it moves, leaves a 10-ft. line of embers; creatures entering it or starting their turn there must succeed on a DC 12 Dex save or take 1d4 fire damage. The line fades at the start of the Emberdart's next turn.\n\n" +
    "Ignite Nectar (bonus action, recharges after a short rest) — while within 5 ft. of a fire-aligned plant or magical heat source, regains 1d4 HP; the plant releases a brief harmless flare of light.\n\n" +
    "Radiant Evasion (reaction) — when hit by an attack or targeted by a spell, teleports up to 10 ft. to an unoccupied space it can see; the vacated space erupts in a bright afterimage, giving the triggering attacker disadvantage on that attack.\n\n" +
    "Solar Pulse (rare) — during a solar event or leyline bloom, speed increases to 40 ft. and it sheds bright light in a 20-ft. radius; if it dies in this state, it releases a harmless pulse that causes rare flora to bloom instantly in a 10-ft. radius.",

  harvestables:
    "Flamefeathers — spell focus for fire magic. Flicker-gas glands — potion ingredient for swift movement or temporary warmth in cold zones.",

  knowledge_table:
    "DC 10: Wings stay lit — not an illusion. Doesn't land; if it's not hovering, it's dead. Always around the hot flowers.\n\n" +
    "DC 15: Feeds on radiant nectar, flares up when hungry. Alchemists harvest flicker-gas from it. Likes music — once seen hovering around a harp.\n\n" +
    "DC 20: Leaves a magic trail that fertilizes the soil. You can hear your name in its buzz, they say. Sleeps in hot air — doesn't roost.\n\n" +
    "DC 25: Its spiral dance makes flowers bloom instantly. Landing on your shoulder means the Summer Court noticed you. Peaceful deaths birth rare plants overnight.",

  ecology_notes:
    "PHYSICAL DESCRIPTION: Length 3–4 in (7.5–10 cm); wingspan up to 6 in (15 cm); weight ~1/20 oz. Iridescent gold-throat, ruby chest, wings alight with magical flame. Superheated needle-form beak leaves scorch trails. Hollow bones filled with flicker-gas, a combustive Feywild vapor aiding lift and energy discharge.\n\n" +
    "ECOLOGICAL ROLE: Primary pollinator of fire-aspected flowers (Ashpetal Bloom, Kindlegrass) — only its flaming, vibrating tongue activates certain seedpods. Acts as a controlled-wildfire agent, clearing dead material so magic-rich soil can form; occasionally seen starting 'cleansing blazes' during overgrowth. Nests near portals or leyline crossings, so its presence may mark a thin place between realms.\n\n" +
    "HABITAT & RANGE: Volcanic slopes, fire-scorched groves, lava tubes, sun-drenched Feywild glades, lava-garden groves, phoenix-bloom meadows, twilight emberspires (Summer Feywild). Requires hot, dry, or magically radiant conditions (ambient high-mana, >120°F/49°C). Nests in firebark trees, built of cinderglass fibers and phoenix down. Flora co-dependents: Ashpetal Bloom (opens only in high heat, pollinated by the Emberdart) and Kindlegrass (ignites when brushed by its wings, clearing old undergrowth for a natural burn cycle).\n\n" +
    "DIET & FEEDING: Mana-rich nectar (flameblossoms, sunlotus, scorchtongue petals), recharging on ambient warmth/sunlight. Secondary: pyro-elemental mites, heat wisps, spark spores. Hover-feeds in bursts, producing an ember drift while feeding.\n\n" +
    "BEHAVIOR: Incredibly territorial — will dive at much larger creatures near its flamegrove, especially near nests or leyline blooms, and this intensifies during bloom season. Never lands — rests by hovering still in warm updrafts, floating heat pockets, or radiant leyflow. Sensitive to tonal vibrations; may react to singing or wind instruments.\n\n" +
    "DAILY CYCLE: Pre-dawn — suspended rest in heat pockets. Morning — patrols, feeding, pollination. Midday — peak flare/dance behavior. Afternoon — passive hovering or resting. Evening — spiral rituals begin. Night — still active, silently circling blooms.\n\n" +
    "MAGICAL TRAITS: Igniting Wings — wingbeats spark flame motes when agitated, causing radiant/fire damage in bursts. Sun-Drunk Frenzy — during peak solar events or in radiant magic zones, enters a euphoric state boosting speed and aggression. Phoenix Pulse (rare) — on death, explodes in a harmless burst of pollen and radiant fire, causing rare plants to bloom instantly in a 10 ft radius.\n\n" +
    "SYMBOLIC ROLE: In local myth, seen as a messenger of rebirth, a warden of balance (burning away the old so the new can grow), and a spirit of radiant flame gifted by solar deities or the Summer Court of the Feywild.\n\n" +
    "REPRODUCTION: Season — High Solstice (Fey midsummer). Courtship — spiral flame-ring flight displays. Clutch size 1–2 ember-eggs, incubated 3 days in fiery moss. Female guards the nest; the male combusts in a ritual 'flarepost' to fertilize the nesting ground.\n\n" +
    "RELATIVES: Closest relatives are Mistwings (Sylas nebulis) and Stormthrushes (Fulmen aviaris); the Emberdart is distinguished by heat-generating nodes on its wing primaries and a tri-lobed mana-adapted heart. Builds aura intensity through feeding ('mana flare index'); attacks illusion spells, possibly mistaking them for rivals; more territorial than most fey avians.",

  encounter_role:
    "Ambush defender, environmental hazard, or ritual guardian; useful in encounter tables as a ward, a sign of ecosystem balance, or a challenge to careless adventurers.",

  notable_quotes:
    "\"It don't flap like a bird. It burns in place, like it's holdin' still through sheer spite.\" — Rangard Ricker\n\n" +
    "\"Observed at dawn in Flameglow Hollow. Sound: faint crackling. Aura: intense, mildly hazardous. Feeding rate: approx. 8 flowers/min. Nesting: thornwreath bloom. Male absent, flarepost confirmed nearby.\" — Field Log: A.V., 5th Sparkmoon",

  source: "Migrated from Capacities (Emberdart.md)",
});

// --- Lore / journal objects, each linked back to the creature and author ---

const originLore = await findOrCreateObject(
  supabase,
  "lore",
  "Origin Lore: The Emberdart's First Flame",
  {
    text:
      "They say the first Emberdart was born when a sunbeam struck the last flower of a dying grove.\n\n" +
      "The tale goes that a wildfire — summoned by careless magic or spiteful fey — swept through a sacred glen where radiant flora once bloomed in harmony. Most perished. But one flower, an Ashpetal on the edge of fading, caught the light of dawn in just the right way. Rather than burn, it shimmered.\n\n" +
      "From that shimmer came a spark. And from that spark, the first Emberdart.\n\n" +
      "It hovered, weightless and glowing, over the charred remains — its wings beating with the sound of flame, not feather. Wherever it flew, the Ashpetals stirred. The fire had not ended the grove. It had cleansed it.\n\n" +
      "Since then, these creatures are said to appear when flame and bloom are in balance. Not summoned, not bred. Simply ignited by need and memory. Some druids believe they are born from the will of the plants themselves — guardians made of beauty, danger, and renewal.",
  }
);

const rangardJournal = await findOrCreateObject(
  supabase,
  "field_journal",
  "Field Journal: Rangard Ricker – Emberdart Observation",
  {
    author: "Rangard Ricker",
    location: "Flamegrove Hollow",
    conditions: "Dry heat, active fire flora, ambient ley energy",
    text:
      "DAY ONE - Midmorning\n" +
      "Arrived at edge of Hollow just past sunrise. Place smells like burned sugar and pine pitch. Air's got a shimmer to it — too hot for birdsong, too still for wind. Spotted the first Emberdart within ten minutes. Hoverin' over a flower I don't recognize — red like a wound, petals twitchin'. Wings sounded like paper catchin' fire. Set up camp in shade of a half-dead spirebark. Not a tree I'd trust to lean on. Succa already complainin' about \"volatile plant boundaries.\" No idea what that means.\n\n" +
      "NIGHT ONE – Just before sleep\n" +
      "Sky's gone copper. Got two of 'em flutterin' around the perimeter like angry fireflies. They're territorial all right — chased off a horned wren with a flash. Tried watchin' one through the scope. Damn near blinded me. The glow gets inside your vision — keeps pulsin' even when you close your eyes. Succa put a wet cloth over hers. Said, \"I'm preserving my ocular clarity, not that you'd care.\" Told her it's just a bird. She told me to burn in a bush. Can't sleep. Too hot. Pitched my blanket near one of their \"resting spots\" — little pocket of warm air, hangs about six feet up. They hover there, dead still. I watched one for an hour. Didn't blink. Not once. Neither did I.\n\n" +
      "DAY TWO – Midday\n" +
      "Found two more nests. If you can call 'em that — they're just cradles of sunbaked cinders, tucked into flower hollows. You get close and the heat rolls off 'em like a forge door crackin'. One Emberdart kept circlin' me, dippin' low like it was testing if I'd flinch. I didn't. It did. Succa says they \"evaluate vibration resonance.\" She means it liked my boots. Got singed reachin' for a sample. Not from the Dart. From the plant it feeds on. Flamegrass lashes out when it's bloomin'. Took a welt on my wrist. Worth it.\n\n" +
      "NIGHT TWO – Half-asleep entry (writing slants, parts smudged)\n" +
      "Woke up sweating. Thought I heard one buzzin' right in my ear. Might've been a dream. Might've been real. Hard to tell in this place. They blink sideways. Did I say that already? Not like a bird. Like a mask closing. Makes me itch behind the eyes. One hovered over Succa while she was asleep. Left a scorch ring in the moss around her bedroll. Looks like a coin. I think they know we're watchin'.\n\n" +
      "DAY THREE – Late Morning\n" +
      "Succa's been following some vine that turned itself into a loop. I told her that's a trap. She told me \"it's curious.\" Might be the same thing. More Emberdarts than before. Bloom season must be nearin'. Saw one do a spiral in the sunbeam — not a dance, exactly. More like a test pattern. The flowers underneath twitched open after. One of 'em clipped my shoulder with its wing. Didn't burn me, just warmed me. Like getting brushed by a candle's breath. That was a warning. They've got rules, these things. You cross a line, they test you. You respect the line, they let you watch.\n\n" +
      "NIGHT THREE – Emberwatch\n" +
      "I took first watch. Honestly didn't feel like sleepin'. Something about the way they move after dark — not random. They're checkin' their routes. I mapped one's pattern. Came back to the same five flowers in the same order, three times over. All of 'em opened just before it arrived, and closed after. That ain't instinct. That's coordination. There's something… smart about 'em. Not talkin'-smart. But timed smart. Rhythm. Like wildfire with a song behind it.\n\n" +
      "DAY FOUR – Departure Prep\n" +
      "Packed up slow this morning. Didn't want to rush it. They're quiet today. Hoverin' high, further off. Almost like they're watchin' us now. Succa said they're \"anticipating something.\" She means the Solstice Bloom, but maybe not just that. I left a ring of firegrass braided into a knot. Just outside the grove. Felt like the right thing. One of 'em came down and landed on it. For just a second. They do land. Just not for us.\n\n" +
      "Rangard's Field Reflection\n" +
      "\"You watch it long enough, and you stop lookin' for fire. You start listenin' for rhythm. Same blooms. Same time. Same spiral. This thing don't live in a place — it lives in a cycle. That ain't just survival. That's harmony.\"",
  }
);

const succaJournal = await findOrCreateObject(
  supabase,
  "field_journal",
  "Field Journal: Succa Dogwood – Botanical Observations",
  {
    author: "Succa Dogwood",
    filed_under: "Ferox Mission – Emberdart Ecosystem",
    location: "Flamegrove Hollow",
    lead: "Rangard Ricker",
    text:
      "DAY ONE – Afternoon, post-arrival\n" +
      "The first thing you notice here isn't the Emberdarts. It's the way the flowers hum. Not poetically — literally. Vibrational pollen channels. The flamepetals respond to heat signatures. When an Emberdart passes, they flare open like fans at a solstice opera. Identified three new growths I've never seen: Ashpetal Bloom (blooms only at 112°F or higher), Kindlegrass (lashes with radiant sparks if handled while open), Sunspike Vine (tightly coiled, opens only if brushed by heat from above). (Note: Rangard stepped on the Sunspike. It bit him. I did not laugh... I did.)\n\n" +
      "NIGHT ONE – Sitting by the glow\n" +
      "While Rangard tried to sketch one of the Emberdarts, I focused on the Ashpetals. They pulse. They breathe. And not just when stimulated — they hold memory. I touched a bloom an Emberdart had visited, and it released a short flare. Residual mana. These plants are symbiotic spell-filters. They burn clean and store radiant traces from the Dart. This is not a random relationship. P.S. Rangard keeps calling the Darts \"cinderhummers.\" I'm going to bury his boots in sentient moss.\n\n" +
      "DAY TWO – Midday scorch\n" +
      "Nearly passed out from heatstroke. Spent an hour beneath a canopy of scorchtongue leaves — the only shade that feeds you light instead of blocking it. The Emberdarts returned to the same flower circuit. I followed them. Noticed the Kindlegrass learned the Dart's pattern. It opened early. It anticipated. I tried to mimic the Dart's flight angle with a small illusion cantrip. The plants ignored me. (F*cking rude.)\n\n" +
      "NIGHT TWO – Slightly dosed, fully alert (Microdosed one petal of firecap. Felt mycelially connected. Clarity ++.)\n" +
      "Observed the Sunflute Cluster reacting to multiple Emberdarts in sequence. The cluster bent slightly toward the second Dart but not the first. Possibility: sequence memory or pollen saturation logic. These plants have hierarchy. They prioritize interaction with \"alpha\" Darts — larger, more radiant individuals. Likely a courtship behavior linked to solar resonance.\n\n" +
      "DAY THREE – Unofficial conclusion\n" +
      "The Emberdarts are caretakers, not just pollinators. They activate these plants. Each flower responds differently to which Dart visits. Suggests pheromonal or magical imprinting — possibly even emotional. Final plant count: 3 confirmed pollination-only species, 2 suspected radiant-seed activators, 1 (Sunspike) exhibiting predatory overreaction to Dart absence. This ecosystem isn't floral. It's choreographed.",
  }
);

const succaRebuttal = await findOrCreateObject(
  supabase,
  "field_journal",
  "Succa Dogwood's Field Rebuttal",
  {
    author: "Succa Dogwood",
    filed_under: "Codex Ferox – Sylas igniculus (Emberdart)",
    classification_level: "Ferox Mission – Secondary Observer",
    text:
      "I respectfully submit the following amendments to Rangard Ricker's field record on the Emberdart. While I greatly admire his caution and commitment to creature observation, his habit of describing flora as \"that spiky one\" or \"the crunchy bloomer\" compels me to provide corrections.\n\n" +
      "Clarification #1: The Kindlegrass Isn't \"Predictive\" — Rangard noted that the Kindlegrass \"learned\" the Emberdart's flight pattern. While poetic, this is entirely incorrect. Kindlegrass possesses radiant-responsive stigmas that dilate in anticipation of ambient temperature shifts. It does not learn. It simply listens to heat better than most rangers I know listen to science.\n\n" +
      "Clarification #2: The Spiral Dance Is Not a Mating Display (You Buffoon) — What Rangard refers to as a \"mating spiral\" is, according to the bloom response cycle I measured, a triggering behavior for mass blossoming in thermophilic plant species. It causes the Ashpetal Bloom to flare in a synchronized pulse. Is it beautiful? Yes. Is it romantic? Perhaps. But if one more scholar files it as \"a flower foreplay ritual,\" I will lose my mind and then set it alight.\n\n" +
      "Clarification #3: The \"Firecap Dosing\" Incident Was Controlled and Necessary — Yes, I sampled a single petal of Firecap on Night Two. Yes, I did speak to the entire Sunflute Cluster. Yes, I learned that one of them is named \"Vorrie\" and she is an absolute delight. No, I was not hallucinating. I was enhancing data collection.\n\n" +
      "Personal Addendum (To Be Redacted): If Rangard ever refers to my pack as \"fussy elven luggage\" again, I will drag him into the Kindlegrass barefoot. He calls them \"cinderhummers.\" They are radiant guardians of floral synchronization. I call him a godsdamned twig-stuffed meathead. Strike that before we print. — Succa Dogwood",
  }
);

const weatherbeeNotes = await findOrCreateObject(
  supabase,
  "curator_notes",
  "Weatherbee's Menagerie Notes: Exhibit 7A – Sylas igniculus",
  {
    author: "Panthy Weatherbee",
    common_name: "Emberdart",
    status: "Intermittent Display Only",
    location: "Radiant Grove Atrium, upper shelf bloom ring",
    text:
      "\"Its feather fire isn't illusion — just physics we haven't named. Don't whistle. It hates whistling. And for the love of preservation, don't touch the bloomglass — it will bite back. My favorite theory? It was born when a sunbeam kissed the last fire-flower of a dying grove and decided to become a guardian.\"\n\n" +
      "\"Despite its charming proportions, the Emberdart is not to be underestimated. It is a creature of precision flame, radiant instinct, and what I can only describe as airborne indignation.\"\n\n" +
      "This specimen's shimmering combustion is not illusion. Its feathers are perpetually alight — though, curiously, neither consumed nor extinguished. Based on field recordings (many of which show Mr. Ricker recoiling in alarm), I estimate its flame temperature to fluctuate between 400–600 degrees depending on agitation.\n\n" +
      "Though the Emberdart is technically untrainable, I have recorded over two dozen consistent responses to tonal stimuli. Harp glissandos, A-flat trills, and windchime clusters with at least three suspended copper rods appear to calm the creature. Whether this is enjoyment or offense cannot be determined. However, on more than one occasion, it has circled the sound source three times before vanishing in a flare. A curious ritual, if not a courteous one.\n\n" +
      "Theories abound as to their origin. I have reviewed everything from solar fey convergence to spontaneous combustion of forest sprites. I personally favor the \"flareborn myth,\" in which the last flame of a sacred glade rose skyward in search of pollinators and simply... became one. It is poetic nonsense, but then, so are most facts until proven inconvenient.\n\n" +
      "Visitors will note the ambient heat grid beneath the enclosure. This is intentional. The Emberdart will not hover unless satisfied with its thermal environment. If it descends or \"pulses\" midair, the temperature is either too cool… or a guest has whistled in its presence. I cannot stress this enough: do not whistle. Interaction should be visual only. Touching the bloomglass will result in a short discharge, and my patience for new signage is limited. The creature will often perform a brief spiral-dance near the golden Kindlegrass replica — a behavior observed only under very specific light conditions.\n\n" +
      "Auditory Profile: To those with sharp ears or druidic resonance, the Emberdart produces a distinctive sound: rapid crackling, as though sugarglass were fracturing in firelight. There's a melodic hum beneath the sizzle — faint, but rhythmic, like a chorus of heated windchimes.\n\n" +
      "Lastly, some believe witnessing an Emberdart perform its full pattern is a blessing. I consider it an invitation to sneeze for twenty minutes, but guests may interpret as they wish.\n\n" +
      "— P. Weatherbee, Curator Emeritus, Chimerical Collection of Radiant Entities",
  }
);

// --- Connections -------------------------------------------------------------

await linkObjects(supabase, emberdart, rangard, "classified by");
await linkObjects(supabase, emberdart, triumvirate, "classified by");
await linkObjects(supabase, emberdart, originLore, "documented in");
await linkObjects(supabase, emberdart, rangardJournal, "documented in");
await linkObjects(supabase, emberdart, succaJournal, "documented in");
await linkObjects(supabase, emberdart, succaRebuttal, "documented in");
await linkObjects(supabase, emberdart, weatherbeeNotes, "documented in");
await linkObjects(supabase, rangardJournal, rangard, "written by");
await linkObjects(supabase, succaJournal, succa, "written by");
await linkObjects(supabase, succaRebuttal, succa, "written by");
await linkObjects(supabase, weatherbeeNotes, panthy, "written by");

console.log("\nDone: Emberdart migrated.");
