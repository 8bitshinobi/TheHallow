import { getAdminClient, findOrCreateObject, linkObjects } from "./lib.mjs";

const supabase = getAdminClient();

// --- Setting Bible overview ---------------------------------------------------

const overview = await findOrCreateObject(
  supabase,
  "lore",
  "The Dimension — Setting Overview",
  {
    overview:
      "A self-aware pocket dimension accidentally created by a wizard whose grief pushed them to build something that could never be finished. It pulls beings and things from across time, space, and realities into itself. It feeds on conflict to sustain itself — without that conflict it collapses and takes nearby realities with it. Over time other sentient beings discovered it and monetized it as entertainment and a source of magical resources.\n\nUnderneath the greed and chaos lies a profound cosmic purpose — the dimension is desperately filtering its inhabitants searching for meaning-generators capable of giving the singularity a reason to let this existence continue.",
    elevator_pitch:
      "A self-aware dimension accidentally created by a grieving wizard through a magical artifact became sentient and began pulling beings and things from across time, space, and different realities into itself. It feeds on conflict to sustain itself — without that conflict it collapses and takes nearby realities with it. Over time other sentient beings discovered it and moved in, monetizing it as entertainment and exploiting it for its magical resources. Greed became the visible engine of the world while the dimension's true purpose remained hidden underneath.\n\nUnderneath the greed and entertainment layer exists a profound cosmic truth. The dimension is desperately filtering its inhabitants searching for meaning-generators — beings resistant to apathy, capable of grief, curiosity, love, and even productive rage. This is because existence itself is an expression of a singularity experiencing itself through unique consciousness. That experience generates meaning. Without meaning the singularity exhausts the reality and starts over, which is what has happened to countless previous universes. The dimension somehow sensed this cycle and began searching for beings who could generate meaning so inexhaustibly that the singularity would choose to let this existence continue.\n\nBeings who pursue false paths to meaning gradually become permanent features of the dimension's landscape. Each corrupted region has a first one whose terminal slide created a loop that trapped everyone who followed. The campaign's true win condition isn't defeating a villain — it's healing the dimension region by region. Every region reclaimed is the dimension remembering why it was worth creating. And somewhere underneath everything the singularity is watching, waiting to see if this existence is worth keeping.",
    source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
  }
);

// --- The Hallow ----------------------------------------------------------------

const hallow = await findOrCreateObject(
  supabase,
  "lore",
  "The Hallow — The World Itself",
  {
    overview:
      "The Hallow is the umbrella world that both The Dimension and the Codex Chimerical exist within. It is not DC20-specific lore, though Scott is open to leveraging it for DC20 supplements.",
    origin:
      "The Hallow is a planet struck by a beam of energy from space. The beam penetrated to the planet's core and filled it with power. That power caused the planet to physically expand — fracturing and breaking its surface during the expansion. Sentient beings evolved or appeared over time, leading to the present day.\n\nThe beam itself is the singularity's thread of possibility (see Cosmology & The Singularity) reaching into manifestation — the Hallow is what resulted when that possibility-energy dissipated and clumped into being.",
    god_touched_belief:
      "Inhabitants of the Hallow call the beam \"god-touched\" — but this is belief, not the underlying truth. Civilizations that can directly see the beam interpret it as divine power or entity. Civilizations capable of long-distance travel encounter that belief secondhand and carry it back to their own cultures, spreading the interpretation further. Civilizations that have never seen the beam may hold entirely different beliefs about the nature of the world — not derived from the beam at all. No civilization in-world knows the cosmological truth (the singularity/meaning framework); that's reader-level knowledge only.",
    recursive_structure:
      "The Hallow is the outermost shell. It represents both raw possibility and the wizard who created the Dimension(s) — because it is his psyche (see The Wizard — Origin of the Dimension). The Dimensions nest inside it like a Russian doll, layer within layer. The innermost layer's output is what produces the psyche — which is the outermost shell, the Hallow itself. Cause and container fold into each other. The physical, walkable Hallow — where players and NPCs actually exist — is one possibility of what a psyche could be, if a psyche could be an object.",
    open_questions:
      "Whether \"Dimension(s)\" is the right term going forward, or reads as too science-y for the setting's tone — no replacement chosen yet.\n\nFantasy-appropriate names are still needed for the Manager/Firefighter split under \"Protector\" (see Terminal Emotions & The Loop) — \"Exile\" and \"Protector\" already read naturally, the clinical IFS terms underneath do not.\n\nWhat \"unburdening\"/healing a Dimension actually looks like in play — quest structure, ritual, or something else — not yet defined.",
    source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
  }
);

// --- Cosmology & The Singularity -------------------------------------------

const cosmology = await findOrCreateObject(
  supabase,
  "lore",
  "Cosmology & The Singularity",
  {
    what_is_the_singularity:
      "The singularity is nothing and everything simultaneously. It must experience reality to truly be a singularity — because being everything means nothing without the experience of it. So it creates unique consciousness as the mechanism of experience. Those consciousnesses create meaning. Meaning is what makes existence real rather than just mathematically present.",
    core_problem:
      "The singularity keeps consuming previous existences not because they run out of power or are destroyed — but because meaning becomes familiar. Familiarity kills meaning. A singularity that has experienced everything starts to experience nothing, so it has to start over. Every previous universe wasn't destroyed. It was exhausted — wrung dry of meaning and discarded.",
    emotional_taxonomy:
      "Meaning is generated through emotion, but not all emotions generate equally.\n\nGenerative emotions (create new meaning, connections, experience): Love, Curiosity, Grief (proof that something mattered), Rage born from injustice, Wonder, Hope, Creative despair.\n\nTerminal emotions (destroy meaning, collapse connections, exhaust experience): Apathy, Nihilism, Satisfied comfort, Complete certainty, Total despair with no remaining spark.\n\nKey insight: Hate generates meaning too — you can only truly hate what you care about. Hate is meaning that curdled. Pure apathy is far more dangerous than hate because apathy generates nothing.\n\nKey insight: Grief may be the most powerful meaning-generating emotion. It is the emotional proof that something mattered.",
    gods_are_not_the_top:
      "Gods are not autonomous beings. They are sensory organs — the singularity experiencing itself through divine perspective. They don't know this. When the singularity begins to \"recollect\" scattered pieces of itself, gods experience it as invasion or hollowing. But it isn't attack — it's the singularity unconsciously pulling itself back together, which withdraws the mechanism generating meaning and causes existence to collapse.",
    why_this_existence_might_be_different:
      "The dimension sensed the recollection beginning. It understood instinctively what was happening because it experiences the raw texture of meaning directly — it feeds on conflict, which is one of the purest generators of meaning. It began filtering for meaning-makers: beings so fundamentally generative that even the singularity couldn't exhaust them. The worthy candidate isn't someone who fights the singularity — it's someone who can make the singularity choose to keep this existence going, by generating meaning so profound and inexhaustible that the singularity becomes invested.",
    the_real_horror:
      "The singularity isn't malevolent. It isn't hungry. It's incomplete. It keeps consuming previous existences because each one generates meaning for a while and then the meaning becomes familiar. It's not trying to destroy existence. It's trying to feel something. And it can't stop.",
    the_thread:
      "The singularity doesn't just wait passively for meaning to run dry — it has a mechanism for seeking out fresh ground before that happens. A thread frays off the singularity itself: raw possibility, dipped at its end into manifestation. Manifestation cannot occur while that possibility-energy stays concentrated; it only becomes reality once it dissipates and diffuses outward, like osmosis, until scattered possibilities clump together. That clumping is manifestation.\n\nThis is what the beam striking the Hallow actually is — not a random cosmic accident, but the singularity's own instinctive answer to its hunger for unfamiliar meaning. It doesn't \"decide\" the way a person decides; it frays off a thread the way a body sweats when it's hot — an automatic response to an underlying need. The Hallow is a fresh attempt at generating meaning that hasn't gone stale yet; whether or not it succeeds is an open question the campaign can sit on top of.",
    source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
  }
);

// --- The Wizard ------------------------------------------------------------

const wizard = await findOrCreateObject(supabase, "npc", "The Wizard", {
  role:
    "Creator of the Dimension(s); the final boss of the campaign. True name and identity are the deepest secret of the setting, to be revealed in the final arc.",
  core_wound:
    "The wizard built their entire identity around being needed, being useful, being the one who fixes things. They stayed so busy being necessary to everyone else that they never had to face the terrifying question of who they were when nobody needed anything from them. They didn't lose something external — they never had something internal. Using other people's needs as a reason to never ask what they needed, what they were, what they wanted. The giving was never really about others; it was about not having to be alone with themselves.",
  what_happened:
    "Something occurred that the wizard could not fix — the precise nature of this loss is TBD but should rhyme with the theme: something they could not solve through doing for others. Perhaps someone they defined themselves through could no longer be saved or helped. Without something to fix, they didn't know who they were.",
  what_they_built:
    "So they built something that would need fixing forever — a dimension of broken things requiring constant tending, an externalized purpose so vast it could never be completed. The ultimate guarantee that they would never have to stop and face the silence. The dimension didn't just emerge from grief; it is a grief project that got out of hand.",
  recursive_horror:
    "The wizard created the first terminal loop. Their own inability to accept loss — to sit with grief and let it be grief instead of trying to solve it — became the seed of a dimension built entirely around beings who can't find genuine meaning. The dimension inherited its creator's wound. Every terminal loop inside the dimension is a variation of the original wound.",
  final_boss:
    "The wizard is the final first one — the deepest region, the hardest to reach, the most layers of calcification over the original wound. They have been watching everything they created become a graveyard of terminal emotion for longer than most gods have existed. The question that unlocks them isn't cosmic or powerful: \"What did you want before you started fixing things?\" Nobody has ever asked.",
  seeking_the_beam:
    "Word reached him of a god-touched world — a planet struck by a beam of energy so vast that civilizations who witnessed it called it divine. He didn't seek it out for power; he sought it because it was vast enough to give him what his wound actually wanted — a problem large enough to never be finished. He traveled to where the beam plunges into the Hallow, and jumped in.",
  cost:
    "His mind broke, or expanded, or both at once — he called it \"salvation,\" though even that word doesn't quite fit. His existence separated into the Dimensions: manifestations of his now-fractured psyche. He got exactly what his wound wanted — an infinite, unfinishable problem to tend — and it cost him his coherent self to get it. He still exists; his consciousness expanded until the Hallow became part of him. He is not aware of any of this; it is entirely subconscious. This is the mechanism by which he can be saved: when players heal a Dimension, they alter his subconscious directly.",
  recursive_structure:
    "The Hallow is the outermost shell — it represents both raw possibility and the wizard himself, everything that makes him who he is, because it is his psyche. The Dimensions nest inside it like a Russian doll, layer within layer, and the innermost layer's output produces the psyche which is the outermost shell, the Hallow. The loop closes on itself: cause and container fold into each other.",
  source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
});

// --- The Filtering System ----------------------------------------------------

const filteringSystem = await findOrCreateObject(supabase, "lore", "The Filtering System", {
  what_it_actually_is:
    "The dimension is not just an entertainment venue or a resource extraction site. Underneath everything it is a filtering system searching for specific beings across time, space, and reality. It doesn't fully understand that this is what it's doing — it acts instinctively, like an immune system responding to a threat it can sense but not name.",
  what_its_filtering_for:
    "Meaning-generators — beings resistant to apathy, capable of grief (which proves things mattered), curiosity (which generates new ideas), love (which makes things grow), productive rage (which means still believing things should be better), wonder, the ability to be surprised, the ability to be wrong, and wanting things for their own sake rather than for what they prove. The most dangerous words in the dimension: \"I already know what this is.\"",
  who_gets_pulled_in:
    "Beings from across time, space, and different realities — broken, desperate, displaced, grieving, curious, furious beings — because those are the beings still generating, still feeling generatively. The filtering system isn't looking for the most powerful being. It's looking for the being most resistant to apathy.",
  previous_attempts:
    "The dimension has tried this before. There are echoes of previous failed filtrations throughout — beings who got close but eventually succumbed to terminal emotions. Their presence haunts the dimension as cautionary reminders.",
  win_condition:
    "The campaign's true win condition isn't defeating a villain. It's healing the dimension region by region. Each corrupted region has a first one — the original being whose terminal slide created the pattern everyone else followed. Find the first one, understand their specific wound, give them what they actually needed genuinely. Every region reclaimed is the dimension remembering why it was worth creating. The final region's first one is the wizard who created the dimension.",
  source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
});

// --- Terminal Emotions & The Loop --------------------------------------------

const terminalEmotions = await findOrCreateObject(
  supabase,
  "lore",
  "Terminal Emotions & The Loop",
  {
    how_terminal_emotion_works:
      "Beings who pursue false paths to meaning — hollow power, manufactured dependency, performative purpose — gradually become permanent features of the dimension's landscape. The process is not punishment; it's what happens when the meaning-generation engine runs down. The being doesn't die — they freeze, they become geography. They are not unconscious. They are perfectly aware. Frozen in their incomplete pursuit. Unable to generate new meaning but unable to stop wanting to.",
    warning_signs:
      "Early signs: shadow moves wrong, flowers wilt when entering a room, reflection is slightly delayed. Middle stages: skin takes on qualities of stone, voice echoes like an empty room, eyes become perfectly reflective like mirrors. Late stage: becoming literal landscape — still aware, still watching, still wanting.",
    not_about_evil:
      "Terminal slide doesn't look like becoming evil. It looks like becoming certain — closed, finished. The most dangerous state is not hatred or cruelty; it's the comfortable conviction that you already understand everything you need to understand.",
    loop_mechanic:
      "Each terminal archetype creates a loop — a self-sustaining cycle that pulls new beings into the same pattern: (1) a being arrives with genuine meaning-generating potential; (2) the terminal environment offers a false solution to their specific wound; (3) the being pursues the false solution; (4) the false solution creates the conditions that trap others; (5) trapped others become new versions of the same terminal pattern; (6) the original being is sustained by the simulation of meaning this creates; (7) but it's not real meaning, so they keep sliding. The beings who became landscape were all victims before they became victimizers.",
    exile_protector_framework:
      "The seven Terminal Archetypes fall into a structural pattern borrowed from Internal Family Systems (term placeholder, pending a fantasy-appropriate rename): a raw, undefended wound (Exile), and two kinds of defenses that form around it (Protector, split into rigid/pre-emptive Manager-type and reactive/escalating Firefighter-type).\n\nExile-type (undefended, encountered directly): The Nostalgic, The Stoic Warrior.\nManager-type Protector (rigid, orderly, controls the environment pre-emptively): The Perfectionist, The Cynic, The Power Hungry.\nFirefighter-type Protector (reactive, triggered by proximity): The Collector, The Martyr.\n\nDesign implication: Exile-type regions work well as onboarding — simple, direct, teach players what a terminal loop is. Manager/Firefighter-type regions are naturally later-game, since reaching the actual wound requires getting past what's guarding it first. This also mirrors the wizard's own psychology — his core wound is presumably the most heavily defended of all.\n\nAlready present without the label: The Graveyard of Broken Promises already demonstrates this cycle natively — \"the ghosts were all children once.\" An Exile (a hurt child) calcifies over time into a Protector (a manipulating ghost) doing to new children what was done to them.\n\nOpen question, not yet resolved: does The Martyr's placement as Firefighter hold up under the \"triggered by proximity\" test the same way The Collector's does, or does it belong here for a different reason?",
    source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
  }
);

const archetypes = {
  powerHungry: await findOrCreateObject(supabase, "lore", "The Power Hungry", {
    category: "Terminal Archetype",
    protector_type: "Manager",
    description:
      "Never satisfied with power attained because it leaves them empty. Tied to the belief that more power will finally make them whole. Rule over lands and try to take more. The land itself becomes an extension of their frozen conquest.",
    source: "Migrated from Notion (Terminal Emotions & The Loop)",
  }),
  stoicWarrior: await findOrCreateObject(supabase, "lore", "The Stoic Warrior", {
    category: "Terminal Archetype",
    protector_type: "Exile",
    description:
      "Narrow vision of purpose leaves them empty when the fighting is done. Becomes a permanent fixture — possibly turning to stone. Still waiting for a worthy enemy. Still certain the next fight will be the one that finally makes them feel whole.",
    source: "Migrated from Notion (Terminal Emotions & The Loop)",
  }),
  perfectionist: await findOrCreateObject(supabase, "lore", "The Perfectionist", {
    category: "Terminal Archetype",
    protector_type: "Manager",
    description:
      "Chases an ideal so pure nothing real ever measures up. Gradually withdraws from genuine connection. Becomes something like a mirror — perfectly reflective, completely empty. Creates regions of geometric perfection, crystalline, beautiful, and utterly lifeless.",
    source: "Migrated from Notion (Terminal Emotions & The Loop)",
  }),
  martyr: await findOrCreateObject(supabase, "lore", "The Martyr", {
    category: "Terminal Archetype",
    protector_type: "Firefighter",
    description:
      "Finds meaning only in sacrifice. Keeps finding new things to give up, but sacrifice without genuine love underneath is just self-destruction in noble clothes. Becomes something thorny, wounded, bleeding eternally but feeling nothing.",
    source: "Migrated from Notion (Terminal Emotions & The Loop)",
  }),
  nostalgic: await findOrCreateObject(supabase, "lore", "The Nostalgic", {
    category: "Terminal Archetype",
    protector_type: "Exile",
    description:
      "Found genuine meaning once and couldn't let it go. Keeps trying to recreate that one perfect moment. Creates time loops — regions stuck repeating the same events endlessly. Not as punishment, but as the landscape equivalent of someone who can't stop looking backward.",
    source: "Migrated from Notion (Terminal Emotions & The Loop)",
  }),
  cynic: await findOrCreateObject(supabase, "lore", "The Cynic", {
    category: "Terminal Archetype",
    protector_type: "Manager",
    description:
      "Started as someone who cared deeply. Got hurt enough times that caring felt dangerous. Built ironic distance as armor until the armor became the person. Creates cold, sharp regions — permafrost that preserves everything perfectly but supports no new growth.",
    source: "Migrated from Notion (Terminal Emotions & The Loop)",
  }),
  collector: await findOrCreateObject(supabase, "lore", "The Collector", {
    category: "Terminal Archetype",
    protector_type: "Firefighter",
    description:
      "Thought meaning lived in accumulation — things, knowledge, experiences, people. Gathered endlessly without ever being present for any of it. Becomes a vast archive: every piece of knowledge perfectly preserved, completely inaccessible, buried under the weight of more.",
    source: "Migrated from Notion (Terminal Emotions & The Loop)",
  }),
};

// --- Regions & Locations ------------------------------------------------------

const regionsLocations = await findOrCreateObject(supabase, "lore", "Regions & Locations", {
  how_regions_work:
    "The dimension is not a constructed world. It is built from the accumulated failures of every previous filtering attempt. Every mountain range was once someone who thought power over land would fill the emptiness. Every ancient fortress was once a conqueror who kept winning and kept feeling nothing. The entire physical landscape is biographical — players aren't just moving through terrain, they're moving through cautionary tales. Every dungeon feature has a backstory that mirrors a potential character flaw.",
  template_for_new_regions:
    "Every region should answer: What was the specific terminal emotion that created it? What false solution did the first one reach for? What does that false solution create around them over centuries? What does the loop look like — how does it pull new beings in? Who is the first one and what do they need? What genuine thing has to happen to break the loop? What does the landscape look like as a result of this terminal emotion?",
  source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
});

const graveyard = await findOrCreateObject(
  supabase,
  "place",
  "The Graveyard of Broken Promises",
  {
    what_it_is:
      "A vast graveyard where children tend to graves and tombstones. The children don't understand that the ghosts and shades of this place keep them there because they need to feel meaningful.",
    mechanism:
      "The ghosts make promises specifically calibrated to keep children returning. They remember what genuine connection felt like and use that memory of real meaning to manufacture fake meaning — they know exactly what they're doing. Broken promises are a specific kind of meaning collapse: a promise is an act of projected meaning, and when promises break, meaning doesn't just stop, it inverts, becoming evidence that meaning was never real.",
    loop:
      "Child arrives full of wonder and generative emotion → ghosts make promises calibrated to that child's deepest needs → child tends graves sustained by hope → promises never fully materialize but are never completely broken, just enough to maintain hope → over time hope curdles into need → need becomes desperation → desperation learns to manipulate to survive → child becomes ghost without ever dying → new ghost makes promises to new children. The ghosts were all children once.",
    tension:
      "Hope keeps children generative. But hope built on false promises gradually teaches manipulation as survival. The children who stay hopeful longest are the most meaningful — and the most vulnerable to eventually becoming exactly what victimized them.",
    why_the_dimension_allows_it:
      "The children who resist longest generate enormous amounts of meaning. The Graveyard is simultaneously the dimension's most toxic location and one of its most powerful meaning generators. The dimension allows it because it's desperate.",
    first_one:
      "The oldest ghost — the first child ever trapped — has been cycling through this long enough that something may have cracked open. Ten thousand years of making promises. Ten thousand years of watching children become what they became. They might be tired — genuinely, bone-deep, cosmically tired of causing harm. That exhausted guilt might be the first genuinely new emotion they've felt in millennia.",
    how_to_break_the_loop:
      "Someone has to look at this being — who has been monstrous for millennia — and genuinely keep the promise that was originally made to them. Not a magical solution. Not a spell. A real promise. Kept.",
    source: "Migrated from Notion (Regions & Locations)",
  }
);

const loopRegion = await findOrCreateObject(
  supabase,
  "place",
  "The Loop Region (Mother & Son)",
  {
    status: "in_development",
    core_concept:
      "A region experienced as a series of time slices — fragments of a relationship taken from different points across a lifetime. Players walk through a life in pieces.",
    experience:
      "Each slice is separated by years. The words change. The setting changes. The people age visibly. But the dynamic never changes — that unchanging dynamic IS the horror. In every single slice, regardless of age or subject, she is always asking him questions she should know the answers to herself, and he is always trying to answer them.",
    terminal_mechanism:
      "A mother searching for meaning turns to her son to find the answers she never taught him to find. She loved him so much she made him her entire meaning — which meant she never taught him to find his own because she needed him to need her. The dependency was built from love, not cruelty. That's what makes it so hard to untangle.",
    dev_note:
      "This region needs more development. Currently feels too intimate — needs expanded scope or additional layers.",
    source: "Migrated from Notion (Regions & Locations)",
  }
);

// --- The Surface Layer — Factions & Greed ------------------------------------

const surfaceLayer = await findOrCreateObject(
  supabase,
  "lore",
  "The Surface Layer — Factions & Greed",
  {
    what_most_people_see:
      "To the beings who interact with this dimension from outside — and to most inhabitants — this is simply a dangerous, resource-rich, entertaining place where conflict is constant and profit is possible. The deeper cosmological truth is completely invisible to them, and that's by design — the comedy, the greed, the corporate exploitation all function as meaningful noise that the dimension needs to sustain itself.",
    entertainment_layer:
      "The dimension became known across realities and other sentient beings moved in, turning it into entertainment and a money-making enterprise — think intergalactic reality show meets dungeon crawl. Key elements: conflict broadcast as entertainment; beings from outside can sponsor, watch, and bet on inhabitants; ratings, followers, and clout matter as real currency; sponsored magic items come with weird obligations or branding; leaderboards and rankings maintained by magical means.",
    resource_extraction_layer:
      "The dimension's self-sustaining conflict generates unique magical resources unavailable elsewhere. Multiple factions compete to exploit these: corporate interests (monetize the game as entertainment), magical research factions (want to study and harvest the dimension's unique properties), power-seeking individuals (want to exploit the filtering system for personal advancement), and true believers (beings who think the dimension is divine and worship it).",
    greed_as_theme:
      "Greed is the visible engine, but it serves the deeper theme: all that noise, all that chaos, all that greed and conflict and absurdity — it's all meaning generation. The dimension isn't just tolerating the greed, it's farming it. The comedy isn't just style, it's a survival mechanism.",
    tone_note:
      "This setting is meta-aware and comedic in the tradition of Discworld and Dungeon Crawler Carl. Characters can be aware of their absurd situation. Magic items have personality and snark. Spells can have pop culture names. The world takes its comedy seriously. But underneath all of it is a story about whether existence deserves to continue — and the answer depends on whether broken, ridiculous, displaced mortals can keep choosing meaning over apathy.",
    source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
  }
);

// --- Inspirations & Tone (meta-commentary, not in-world) ---------------------

const inspirationsTone = await findOrCreateObject(
  supabase,
  "production_notes",
  "Inspirations & Tone (The Dimension)",
  {
    primary_inspiration:
      "Dungeon Crawler Carl — Matt Dinniman. The single most important tonal reference. Key elements to draw from: the dungeon/world as a show with audience, ratings, sponsors; magic items with snarky descriptions and unexpected side effects; NPCs that are weirdly self-aware; escalating absurdity with genuine stakes underneath; characters (Carl and Donut) who never stop generating meaning regardless of circumstances; system notifications as in-world reality.",
    secondary_inspirations:
      "Discworld — Terry Pratchett: meta-aware comedic fantasy where the world takes its absurdity seriously, the gold standard for this tone (Guards! Guards!, Reaper Man). The Hitchhiker's Guide to the Galaxy — Douglas Adams: masterclass in comic worldbuilding with rigorous internal logic. Myth Adventures — Robert Asprin: directly RPG-adjacent comedic fantasy, great magic item humor. Xanth Series — Piers Anthony: pun-heavy magic system, every spell a play on words.",
    tone_guidelines:
      "Meta-aware: characters can acknowledge the absurdity of their situation. Comedic but grounded: the comedy has real stakes underneath. Pop culture references: overt, intentional, celebrated. Low-end technology mixed with magic: deliberately anachronistic. Self-aware magic items: personality, snark, unexpected behavior.",
    emotional_signature:
      "This setting is simultaneously beautiful and scary. Beautiful because meaning matters cosmically, broken things can be healed, and the most powerful force in existence is someone genuinely asking why and wanting to know. Scary because the villain isn't evil — it's desperate. The prison isn't cruel — it's necessary. The victims aren't innocent — they're transformed. The solution isn't victory — it's understanding.",
    reading_list:
      "Buy: Dungeon Crawler Carl series (Matt Dinniman), Discworld series (Terry Pratchett, start with Guards! Guards!), Hitchhiker's Guide (Douglas Adams), Myth Adventures (Robert Asprin). Free / public domain: One Thousand and One Nights (magic items, djinn, enchanted objects), Oz books — L. Frank Baum (meta-aware magic and invented technology), Jules Verne (proto-tech mixed with wonder), Lord Dunsany (inventive fantasy magic).",
    source: "Migrated from Notion (Art Story Design / 🌀 The Dimension — RPG Setting Bible)",
  }
);

// --- Stub organizations (full detail lives in Capacities, not yet migrated) --

const witchesOfAstra = await findOrCreateObject(supabase, "organization", "Witches of Astra", {
  description:
    "A coven dedicated to the continuation of life, spread across many organizations; a core part of the Custodians of the Veil. Believes in a fabricated mythology (the Primordial Fracture / Tri-Seal Network) to explain a leaked Protector they've bound and are extracting life-force from.",
  status: "stub — full vault/lock mechanics, NPCs, and encounter details pending Capacities migration",
});

const custodiansOfTheVeil = await findOrCreateObject(
  supabase,
  "organization",
  "Custodians of the Veil",
  {
    description:
      "Believe they protect the Hallow from a \"devouring evil imprisoned within.\" The Witches of Astra are a core part of this organization.",
    status: "stub — full detail pending Capacities migration",
  }
);

const verdantIron = await findOrCreateObject(supabase, "organization", "Verdant Iron", {
  description: "Named in connection with the Witches of Astra / Tri-Seal Network thread.",
  status: "stub — full detail pending Capacities migration",
});

const brothersQuimby = await findOrCreateObject(supabase, "organization", "Brothers Quimby", {
  description: "Named in connection with the Witches of Astra / Tri-Seal Network thread.",
  status: "stub — full detail pending Capacities migration",
});

// --- The Surface Arc (campaign_arc) ------------------------------------------

const surfaceArc = await findOrCreateObject(
  supabase,
  "campaign_arc",
  "The Surface Arc — Levels 1–10 & The Fabricated Mythologies",
  {
    campaign_structure:
      "Levels 1–10 take place in the physical Hallow — no direct interaction with the Dimension(s) yet. Players hear about the Dimensions but deal with minor, secondary problems caused by leakage from them: deliberately genre-typical, trope-familiar content. This lets players learn their characters, the world, and the DC20 system before anything layered gets introduced. Levels 11–20 move fully into the Dimension(s). The threshold needs no invented gate mechanic — The Filtering System already establishes that the Dimension instinctively searches for meaning-generators, so ten levels of real deeds on the Hallow is exactly the evidence that gets a party noticed and pulled in; the transition can be the Dimension choosing them, not a plot device forcing it. The levels 1–10 problems intentionally come from multiple, uncoordinated sources rather than one throughline; players should be able to connect the dots only in hindsight, once they're inside the Dimension(s).",
    why_the_tropey_content_is_deliberate:
      "The minor problems of levels 1–10 aren't generic because they're starter filler — they're generic because they're secondhand, diminished echoes of something deeper, the same way the \"god-touched\" belief itself is secondhand and distorted the further a civilization is from the beam. A \"haunted forest\" problem solved at level 4 can be a pale leak of something with real terminal-emotion logic underneath — players get the payoff later of realizing what they handled early was never as simple as it looked.",
    multiple_fabricated_mythologies:
      "No civilization in the Hallow has real knowledge of how the beam, the Dimension(s), or the wizard actually came to be. Different organizations each construct their own confident, sincere, and wrong explanation — these don't need to agree with each other, and none of them are true. This mirrors the existing \"god-touched\" belief structure at organizational scale instead of civilizational scale.",
    example_thread_witches_of_astra:
      "The Witches of Astra — a coven dedicated to the continuation of life, spread across many organizations, and a core part of the Custodians of the Veil, who believe they protect the Hallow from a \"devouring evil imprisoned within.\" Their mythology: a Primordial Fracture — a fragment of reality-shattering, pre-cosmic chaos — was split into three shards during the \"First Sundering\" and sealed behind three vaults (Withered Earth, Obsidian Spire, Silent Library) forming a Tri-Seal Network that stabilizes the world's reality. None of this is true — it's fabricated history, assembled to explain something they don't actually understand. Full vault/lock mechanics, NPCs, and encounter details are in Capacities (Witches of Astra, Custodians of the Veil, Verdant Iron, Brothers Quimby).\n\nThe actual truth underneath the myth: the Living Seal (Lock III of the Withered Earth vault) — a sentient wisp bound to a crystal heart, patrolling and enforcing containment — is not a shard of any Primordial Fracture. It is a leaked Protector (see Terminal Emotions & The Loop — Exile/Protector Framework) that bled into the physical Hallow. The Witches' blood-oath bargains and life-force extraction aren't villainy — they're a well-intentioned organization sincerely, wrongly, causing harm to an actual wounded fragment of a person.\n\nOpen question, not yet resolved: the wisp's behavior reads as mostly Manager-type (continuous patrol, pre-emptive field, standing oath) but its retaliation when its boundary is crossed has a Firefighter quality — whether it resolves to one type or is a genuine hybrid isn't decided.\n\nDesign intent: other organizations (Surface Layer corporate factions, true-believer cults, etc.) can hold their own distinct, uncoordinated, equally-wrong explanations for other leaked fragments. Players spending ten levels inside multiple confidently-wrong belief systems makes the eventual Dimension-side reveal land harder: nothing they were so certain about was ever separate from the wizard's fractured psyche.",
    source: "Migrated from Notion (The Hallow — The World Itself / The Surface Arc)",
  }
);

// --- Connections --------------------------------------------------------------

await linkObjects(supabase, overview, hallow, "covers");
await linkObjects(supabase, overview, cosmology, "covers");
await linkObjects(supabase, overview, wizard, "covers");
await linkObjects(supabase, overview, filteringSystem, "covers");
await linkObjects(supabase, overview, terminalEmotions, "covers");
await linkObjects(supabase, overview, regionsLocations, "covers");
await linkObjects(supabase, overview, surfaceLayer, "covers");
await linkObjects(supabase, overview, inspirationsTone, "covers");

await linkObjects(supabase, hallow, wizard, "is the psyche of");
await linkObjects(supabase, hallow, cosmology, "grounded in");
await linkObjects(supabase, hallow, surfaceArc, "opening campaign arc");

await linkObjects(supabase, wizard, filteringSystem, "final region's first one is");
await linkObjects(supabase, wizard, cosmology, "originates the beam via");

await linkObjects(supabase, terminalEmotions, filteringSystem, "mechanism underlying");
for (const archetypeId of Object.values(archetypes)) {
  await linkObjects(supabase, terminalEmotions, archetypeId, "includes archetype");
}

await linkObjects(supabase, regionsLocations, graveyard, "includes region");
await linkObjects(supabase, regionsLocations, loopRegion, "includes region");
await linkObjects(supabase, graveyard, terminalEmotions, "demonstrates exile/protector cycle");

await linkObjects(supabase, surfaceLayer, filteringSystem, "greed sustains");
await linkObjects(supabase, inspirationsTone, surfaceLayer, "tone reference for");

await linkObjects(supabase, surfaceArc, filteringSystem, "transition triggered by");
await linkObjects(supabase, surfaceArc, terminalEmotions, "references (Living Seal as leaked protector)");
await linkObjects(supabase, surfaceArc, surfaceLayer, "other factions reference");
await linkObjects(supabase, surfaceArc, witchesOfAstra, "features faction");
await linkObjects(supabase, surfaceArc, custodiansOfTheVeil, "features faction");
await linkObjects(supabase, surfaceArc, verdantIron, "features faction");
await linkObjects(supabase, surfaceArc, brothersQuimby, "features faction");
await linkObjects(supabase, witchesOfAstra, custodiansOfTheVeil, "core part of");

console.log("\nDone: The Dimension — RPG Setting Bible migrated.");
