/**
 * PLACEHOLDER tavern generator content — generic fantasy filler, not Hallow
 * canon. Edit freely: every list is plain strings, and the generator picks
 * uniformly from each (repeat an entry to make it more likely).
 */

export const CROWDS = ["Townsfolk", "Travelers", "Border-wary", "Drawing-season"] as const;
export type Crowd = (typeof CROWDS)[number];

export function isCrowd(value: string | undefined): value is Crowd {
  return (CROWDS as readonly string[]).includes(value ?? "");
}

export const NAME_FIRST = [
  "Crooked", "Gilded", "Hollow", "Merry", "Rusty", "Sleeping", "Weeping", "Broken",
  "Laughing", "Last", "Drowned", "Wandering", "Tarnished", "Salted", "Quiet", "Thirsty",
];

export const NAME_SECOND = [
  "Lantern", "Kettle", "Anchor", "Stag", "Barrel", "Crow", "Wheel", "Candle",
  "Compass", "Goose", "Spindle", "Ladder", "Hearth", "Bell", "Cart", "Nail",
];

/** Building type used in names ("The Crooked Lantern Inn") and descriptions. */
export const KINDS = ["tavern", "inn", "alehouse", "roadhouse", "taproom"];

export const NAME_PATTERNS = [
  "The {first} {second}",
  "The {first} {second}",
  "The {second} & {second2}",
  "{first} {second} {kind}",
];

export const DESCRIPTION_ADJECTIVES = [
  "low-beamed", "smoky", "cramped", "surprisingly clean", "drafty", "lopsided",
  "warm", "dim", "noisy", "half-empty", "well-worn", "rambling",
];

/** Used when the chosen region has no tavern_theme. */
export const DESCRIPTION_TAILS = [
  "with a fire that never quite goes out",
  "where the floorboards tell on everyone",
  "with a back room nobody explains",
  "that smells of woodsmoke and spilled cider",
  "with a corner table that's always taken",
  "where the regulars have opinions about your seat",
];

/** Used when the region has tavern_theme keywords; {theme} is one keyword. */
export const DESCRIPTION_THEMED_TAILS = [
  "shaped by its {theme} surroundings",
  "where everything, down to the mugs, feels {theme}",
  "that wears its {theme} reputation openly",
  "kept going by the {theme} trade around it",
];

export const INNKEEPER_FIRST = [
  "Alda", "Brannoch", "Corvin", "Dessa", "Edrin", "Fenna", "Garrick", "Hilde",
  "Ismay", "Jorund", "Kestrel", "Lorna", "Marek", "Nessa", "Orrin", "Pell",
];

export const INNKEEPER_LAST = [
  "Ashby", "Barleycorn", "Coldwater", "Dunmore", "Fairweather", "Greaves",
  "Harrow", "Ironside", "Kettleby", "Longstride", "Marsh", "Thistle",
];

export const INNKEEPER_QUIRKS = [
  "Counts every coin twice, out loud.",
  "Hums the same three notes all night.",
  "Never sits down, on principle.",
  "Names every mug and scolds the ones that chip.",
  "Remembers everyone's order and no one's name.",
  "Refuses to serve anyone who says the weather is nice.",
  "Keeps a running tally of bar fights on a chalkboard.",
  "Speaks to the cat as though it were a business partner.",
];

/** [name, base price in cp at a middle-class tavern] */
export const DRINKS: [string, number][] = [
  ["small beer", 1],
  ["thin house ale", 2],
  ["spiced cider", 3],
  ["hot cider with cloves", 3],
  ["dark barley stout", 4],
  ["honeyed mead", 5],
  ["juniper spirit", 6],
  ["pear brandy", 8],
];

export const FOODS: [string, number][] = [
  ["barley porridge with onions", 2],
  ["bean and bacon pot", 3],
  ["cheese and black bread", 3],
  ["meat pie", 4],
  ["fried river fish", 4],
  ["mutton stew with bread", 5],
  ["smoked trout and boiled roots", 6],
  ["roast fowl", 8],
];

export const TAVERN_ROLES = [
  "bartender", "cook", "serving hand", "bouncer", "stable-hand",
  "cellar-keeper", "pot-boy", "chambermaid", "minstrel", "dishwasher",
];

/**
 * "House specialty" pieces (placeholders). A signature is a name built from
 * {adjective} + {base}, plus an effect. The region's tavern_theme, if any, is
 * added as a "(think: ...)" hint so the item feels tied to the place.
 */
export const SIGNATURE_ADJECTIVES = [
  "Crooked", "Blushing", "Old", "Midnight", "Grinning", "Tangled", "Bottomless", "Widow's",
];

export const SIGNATURE_DRINK_BASES = ["Cordial", "Ale", "Tonic", "Mead", "Brandy", "Cider"];
export const SIGNATURE_FOOD_BASES = ["Stew", "Pie", "Dumplings", "Broth", "Roast", "Bread"];

export const SIGNATURE_DRINK_EFFECTS = [
  "turns your skin pink for an hour",
  "makes you briefly, inexplicably irresistible",
  "makes everything you say sound like a prophecy",
  "leaves you faintly glowing until dawn",
  "lets you hear the room's thoughts for a minute or two",
  "makes your hair stand on end and your voice go an octave higher",
];

export const SIGNATURE_FOOD_EFFECTS = [
  "leaves your fingertips glowing faintly until morning",
  "makes you unable to tell a lie until the next meal",
  "gives you perfect recall of a stranger's face",
  "makes you hiccup small sparks",
  "makes you sleep soundly and dream in color",
  "makes every dog in town love you for a day",
];

export const PATRONS: Record<Crowd, string[]> = {
  Townsfolk: [
    "A carter complaining about the state of the roads",
    "Two weavers arguing over the price of wool",
    "A night-watchman off shift, boots up by the fire",
    "A baker's apprentice asleep on a bench",
    "A retired soldier who tells the same story every night",
    "The local reeve, pretending to be off duty",
    "A widow who knits and misses nothing",
    "A pair of brothers at a card game that's run for years",
    "A young clerk nursing one drink for three hours",
    "A cooper in leather apron, still smelling of oak",
    "A gossiping washerwoman holding court",
    "A farmhand counting out coins for a second round",
    "An old fisherman muttering at his cup",
    "The town's only barber, loudly dispensing opinions",
    "A schoolteacher marking papers by candlelight",
  ],
  Travelers: [
    "A caravan guard comparing scars with a stranger",
    "A merchant guarding a locked strongbox with one boot",
    "A pilgrim sharing a loaf with the whole table",
    "A tinker with a pack full of clinking pots",
    "A courier who won't say who they work for",
    "A pair of siblings on their way to a wedding",
    "A wandering minstrel tuning a battered lute",
    "A mule-driver who smells of mule",
    "A scholar squinting at a map over cold stew",
    "A quiet traveler in a hood, luggage kept close",
    "A trader haggling over the price of a room",
    "A sunburned sailor a long way from any sea",
    "A lost-looking apprentice clutching a letter",
    "A drover swapping road news for a free drink",
    "A limping stranger asking about the next town",
  ],
  "Border-wary": [
    "A hard-eyed local who stops talking when the door opens",
    "A sentry with a hand never far from their belt",
    "A nervous drinker who sits facing the entrance",
    "A farmer who bolts the shutters early",
    "A veteran who counts the strangers in the room",
    "A quiet pair sharing a table but not a word",
    "A patrol captain nursing a single cup",
    "A shepherd who refuses to talk about the far pasture",
    "A woman who keeps a crossbow under her chair",
    "A boy sent to watch the road and report back",
    "A trapper with a lot to say about what's been out there",
    "A merchant who insists on paying in advance and leaving early",
    "An old man who watches the windows, not the fire",
    "A group of neighbors talking low, in a tight circle",
    "A stranger everyone is very carefully ignoring",
  ],
  // Placeholder: what "drawing season" means in the world isn't defined in the archive.
  "Drawing-season": [
    "A loud group swapping predictions and side bets",
    "A visitor who has traveled far for the season and says so often",
    "A family squeezed onto one bench, all talking at once",
    "A gambler recounting past seasons at length",
    "A nervous hopeful, too anxious to eat",
    "A pair of rivals in friendly, escalating argument",
    "A street vendor with a tray of season trinkets",
    "A veteran of many seasons giving unsolicited advice",
    "A bard composing a song about it in real time",
    "A crowd packed shoulder to shoulder around the fire",
    "A traveling merchant delighted with the extra trade",
    "A child on someone's shoulders, watching everything",
    "A sleepless visitor who has been up since dawn",
    "An official-looking type who is refusing to answer questions",
    "A cheerful drunk toasting complete strangers",
  ],
};

/** Ordinary gossip — deliberately unrelated to established lore. */
export const GOSSIP_RUMORS = [
  "The baker's been watering the flour, and everyone knows it.",
  "Someone saw the miller's daughter leave town before dawn with a full pack.",
  "The well tastes odd since the last rain, though nobody will say so loudly.",
  "A cart of good wine went missing on the north road, and the driver's story keeps changing.",
  "The blacksmith's feud with his brother is finally coming to a head.",
  "There's a wager on how long the new tax collector lasts.",
  "Old Brenn swears he saw the same crow at three different funerals.",
  "The reeve's hat is said to be borrowed.",
];

/** Lore rumor templates; {hook} is a real lore/region/faction/event name. */
export const LORE_RUMOR_TEMPLATES = [
  "Everyone's talking about {hook}, though nobody agrees on what it means.",
  "A traveler here swore something is stirring with {hook}.",
  "Folk lower their voices when {hook} comes up.",
  "Someone at the bar claims to know a person who's seen the truth of {hook}.",
  "They say the trouble lately traces back to {hook}.",
];

/**
 * Stand-in lore hooks used until real ones exist. Real hooks are the names of
 * lore/region/place/organization/event/adventure_hook records marked
 * `visibility: public`. Replace or extend these when you like.
 */
export const PLACEHOLDER_LORE_HOOKS = [
  "[placeholder lore hook 1]",
  "[placeholder lore hook 2]",
  "[placeholder lore hook 3]",
  "[placeholder lore hook 4]",
  "[placeholder lore hook 5]",
];
