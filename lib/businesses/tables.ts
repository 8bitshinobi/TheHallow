/**
 * PLACEHOLDER business generator content — generic fantasy filler, not Hallow
 * canon. Edit freely. The category list is the one agreed for the app; the
 * goods, names, quirks and fronts are all draft text.
 */

export type Front = {
  /** Short label, e.g. "Fence". */
  label: string;
  /** Chance (0-1) that a generated business of this category has this front. */
  chance: number;
  /** GM-only detail lines; one is picked. Never sent by the public API. */
  details: string[];
};

export type BusinessCategory = {
  name: string;
  icon: string;
  /** How the business is described in prose: "A cramped {shop} ...". */
  shop: string;
  /** Words used in generated names: "Crooked {noun}", "Harrow's {noun}". */
  nouns: string[];
  goods: string[];
  /** Extra patrons specific to this trade, mixed into the generic pool. */
  patrons: string[];
  /** A hidden illicit activity this business may be a front for. */
  front?: Front;
};

export const CATEGORIES: BusinessCategory[] = [
  {
    name: "Blacksmith",
    icon: "⚒️",
    shop: "smithy",
    nouns: ["Forge", "Smithy", "Anvil", "Ironworks"],
    goods: [
      "horseshoes", "nails and hinges", "kitchen knives", "plowshares", "sword repair",
      "armor mending", "iron tools", "custom ironwork",
    ],
    patrons: ["A soot-streaked apprentice on an errand", "A soldier waiting on a repair", "A farmer with a cracked plowshare"],
  },
  {
    name: "Stable",
    icon: "🐴",
    shop: "stable",
    nouns: ["Stables", "Livery", "Paddock", "Mews"],
    goods: [
      "horses for hire", "mules and pack animals", "saddles and tack", "stabling by the night",
      "farrier services", "feed and hay", "cart rental", "riding lessons",
    ],
    patrons: ["A courier changing horses in a hurry", "A merchant haggling over a mule", "A stable-boy asleep in the hay"],
  },
  {
    name: "Apothecary",
    icon: "🧪",
    shop: "apothecary",
    nouns: ["Apothecary", "Dispensary", "Mortar & Pestle", "Herbary"],
    goods: [
      "herbal tinctures", "poultices and salves", "sleeping draughts", "dried herbs",
      "fever remedies", "bitters", "bandages and splints", "cough syrups",
    ],
    patrons: ["A worried parent with a feverish child", "A traveler after a remedy for road sickness", "A hooded customer who lingers too long"],
    front: {
      label: "Poisons",
      chance: 0.2,
      details: [
        "Quietly sells poisons to customers who ask the right way.",
        "Keeps a locked cabinet of untraceable toxins behind the counter.",
        "Brews custom poisons for a discreet clientele.",
      ],
    },
  },
  {
    name: "Jeweler",
    icon: "💎",
    shop: "jeweler's shop",
    nouns: ["Jewelers", "Gems", "Settings", "Goldsmith"],
    goods: [
      "silver chains", "signet rings", "cut gemstones", "engraving", "appraisals",
      "mourning jewelry", "lockets", "brooches",
    ],
    patrons: ["A nervous suitor choosing a ring", "A widow selling an heirloom", "A merchant having a stone appraised"],
  },
  {
    name: "General goods",
    icon: "🧺",
    shop: "general store",
    nouns: ["General Store", "Trading Post", "Emporium", "Mercantile"],
    goods: [
      "rope and twine", "lamp oil", "candles", "sacks and barrels",
      "blankets", "cookware", "traveler's rations", "tools and hardware",
    ],
    patrons: ["A farmer stocking up before the weather turns", "A traveler buying supplies for the road", "A child sent for a single candle"],
  },
  {
    name: "Tailor",
    icon: "🧵",
    shop: "tailor's shop",
    nouns: ["Tailors", "Threadworks", "Needle & Thread", "Haberdashery"],
    goods: [
      "mended coats", "dyed cloaks", "uniforms", "wedding clothes",
      "hats and gloves", "alterations", "embroidered banners", "travel clothing",
    ],
    patrons: ["A bride's mother with strong opinions", "A soldier needing a uniform let out", "A merchant who wants to look wealthier than they are"],
  },
  {
    name: "Bakery",
    icon: "🥖",
    shop: "bakery",
    nouns: ["Bakery", "Oven", "Bread & Butter", "Hearth Loaf"],
    goods: [
      "crusty loaves", "honey buns", "meat pies", "seed cakes",
      "festival pastries", "hardtack", "cheese rolls", "sweet rolls",
    ],
    patrons: ["An early riser queuing before dawn", "A cook buying bread for a hundred", "A child clutching a coin for a bun"],
  },
  {
    name: "Bookseller",
    icon: "📚",
    shop: "bookshop",
    nouns: ["Books", "Bindery", "Quill & Folio", "Scriptorium"],
    goods: [
      "used volumes", "maps", "almanacs", "quills and ink",
      "blank journals", "letters written for hire", "pamphlets", "rare manuscripts",
    ],
    patrons: ["A scholar hunting one specific volume", "A clerk buying ink by the crate", "A traveler asking for the local map"],
  },
  {
    name: "Wine/Spirits",
    icon: "🍷",
    shop: "wine and spirits shop",
    nouns: ["Cellar", "Vintners", "Still", "Cask & Cork"],
    goods: [
      "local wines", "distilled spirits", "casks by the barrel", "tasting flights",
      "bottled cordials", "imported vintages", "brandy", "corks and bottles",
    ],
    patrons: ["A tavern-keeper restocking by the cask", "A collector arguing over a vintage", "A quiet regular who's never bought a full bottle"],
  },
  {
    name: "Pawnbroker",
    icon: "🏷️",
    shop: "pawnshop",
    nouns: ["Pawn", "Exchange", "Loan & Keep", "Second Hand"],
    goods: [
      "secondhand tools", "unclaimed heirlooms", "loans against valuables", "used weapons",
      "odd jewelry", "cutlery", "musical instruments", "worn clothing",
    ],
    patrons: ["A down-on-their-luck customer pledging a keepsake", "A bargain hunter picking through boxes", "A well-dressed stranger who asks no prices"],
    front: {
      label: "Fence",
      chance: 0.6,
      details: [
        "Stolen goods pass through the back room; cash, no questions.",
        "Buys hot merchandise cheaply and resells it far from where it was taken.",
        "The unclaimed pawn shelf is half stolen property.",
      ],
    },
  },
  {
    name: "Curio shop",
    icon: "🗝️",
    shop: "curio shop",
    nouns: ["Curios", "Oddities", "Cabinet of Wonders", "Trinkets"],
    goods: [
      "strange trinkets", "preserved specimens", "\"genuine\" relics", "small idols",
      "glass eyes", "dried oddities", "forged maps", "antique keys",
    ],
    patrons: ["A tourist convinced everything is authentic", "A collector who knows exactly what they want", "A child pressing their nose to the display glass"],
    front: {
      label: "Smuggling",
      chance: 0.6,
      details: [
        "False-bottomed curios carry contraband past inspectors.",
        "Crates of \"antiques\" are the cover for goods that shouldn't cross the border.",
        "A network of collectors moves banned items through the shop.",
      ],
    },
  },
  {
    name: "Import warehouse",
    icon: "📦",
    shop: "import warehouse",
    nouns: ["Imports", "Warehouse", "Trading Company", "Freight"],
    goods: [
      "crates of foreign goods", "bulk spices", "bolts of cloth", "barrels of oil",
      "tea chests", "cured meats", "storage by the week", "wholesale orders",
    ],
    patrons: ["A buyer with a long shopping list", "A dockhand hauling crates", "A clerk checking manifests twice"],
    front: {
      label: "Contraband",
      chance: 0.6,
      details: [
        "Half the stock is banned goods listed under different names.",
        "The paperwork is immaculate; the crates aren't what they say.",
        "Contraband arrives hidden in ordinary shipments and leaves the same way.",
      ],
    },
  },
  {
    name: "Tea house",
    icon: "🍵",
    shop: "tea house",
    nouns: ["Tea House", "Kettle & Cup", "Steep", "Leaf & Lantern"],
    goods: [
      "pots of tea", "sweet biscuits", "quiet corners", "rare leaves by weight",
      "private booths", "herbal blends", "small cakes", "afternoon service",
    ],
    patrons: ["Two friends deep in conversation", "A businessperson holding a quiet meeting", "A regular who never orders the same tea twice"],
    front: {
      label: "Poisons",
      chance: 0.4,
      details: [
        "Some of the \"rare leaves\" are poisons, sold to those who ask for a special blend.",
        "A private booth is where discreet clients place orders for something lethal.",
        "The tea master brews more than tea for the right customer.",
      ],
    },
  },
  {
    name: "Moneylender",
    icon: "💰",
    shop: "counting house",
    nouns: ["Counting House", "Lender", "Coin & Ledger", "Exchange"],
    goods: [
      "short loans", "coin changing", "letters of credit", "safekeeping in a strongbox",
      "appraisals", "ledger services", "mortgages", "currency exchange",
    ],
    patrons: ["A merchant renewing a loan they can't afford", "A traveler exchanging foreign coin", "A nervous customer avoiding eye contact"],
    front: {
      label: "Loan-sharking",
      chance: 0.5,
      details: [
        "Loans carry ruinous terms, enforced by men who visit late.",
        "Offers easy credit, then takes collateral no one expected to lose.",
        "Debts are quietly sold on to people far less patient.",
      ],
    },
  },
  {
    name: "Funeral parlor",
    icon: "⚰️",
    shop: "funeral parlor",
    nouns: ["Undertaker", "Funeral Parlor", "Rest", "Bier & Sons"],
    goods: [
      "coffins", "burial arrangements", "shrouds", "mourning clothes",
      "wake catering", "headstones", "grave-tending", "embalming",
    ],
    patrons: ["A grieving family making arrangements", "A gravedigger collecting wages", "A cleric confirming the schedule"],
    front: {
      label: "Body-snatching",
      chance: 0.5,
      details: [
        "Supplies bodies to those who pay well and ask no questions.",
        "Some coffins are buried empty, and the contents sold elsewhere.",
        "Steals fresh graves for a buyer who won't say what for.",
      ],
    },
  },
  {
    name: "Bathhouse",
    icon: "🛁",
    shop: "bathhouse",
    nouns: ["Baths", "Bathhouse", "Steam & Soak", "Waters"],
    goods: [
      "hot baths", "steam rooms", "massages", "scented soaps",
      "barbering", "fresh towels", "private rooms", "herbal soaks",
    ],
    patrons: ["A traveler washing off the road", "Two officials talking low in the steam", "A regular who always books the same room"],
    front: {
      label: "Information broker",
      chance: 0.5,
      details: [
        "Conversations in the steam rooms are overheard, recorded and sold.",
        "The attendants collect secrets and pass them to whoever pays.",
        "Certain private rooms are wired for eavesdropping.",
      ],
    },
  },
];

export const CATEGORY_NAMES = CATEGORIES.map((category) => category.name);

export const NAME_ADJECTIVES = [
  "Crooked", "Gilded", "Golden", "Old", "Silver", "Lucky", "Honest", "Blue",
  "Rusty", "Little", "Grand", "Copper",
];

export const NAME_PATTERNS = ["The {adj} {noun}", "{surname}'s {noun}", "{surname} & {surname2} {noun}"];

export const DESCRIPTION_ADJECTIVES = [
  "cramped", "tidy", "busy", "cluttered", "well-kept", "narrow", "old", "bright",
];

export const DESCRIPTION_TAILS = [
  "that's been in the same family for generations",
  "with a hand-painted sign that's seen better days",
  "tucked between two larger buildings",
  "known to everyone in the neighborhood",
  "with a bell that rings twice for every customer",
  "where the counter is older than the building",
];

/** Used when the location has tavern_theme keywords; {theme} is one keyword. */
export const DESCRIPTION_THEMED_TAILS = [
  "shaped by its {theme} surroundings",
  "that has adapted to its {theme} neighbors",
  "kept going by the {theme} trade around it",
];

export const PROPRIETOR_QUIRKS = [
  "Talks to the merchandise.",
  "Won't haggle before noon.",
  "Keeps a ledger of everyone who's ever complained.",
  "Wears the same apron every day, and it shows.",
  "Insists on giving every customer a nickname.",
  "Always seems to be in the middle of a story.",
  "Refuses to accept coins with a certain face on them.",
  "Knows everyone's business, and pretends not to.",
];

/** Patrons for any kind of business; category-specific ones are added on top. */
export const GENERIC_PATRONS = [
  "A regular who comes in every day at the same hour",
  "A first-timer looking lost",
  "A child sent on an errand",
  "Two neighbors arguing over the price",
  "A bargain hunter comparing everything to last week's price",
  "An elderly customer with all the time in the world",
  "A traveler passing through town",
  "A local official pretending to shop",
  "Someone who's clearly there to gossip",
  "A young apprentice on their master's errand",
  "A well-dressed customer who never gives a name",
  "Someone with an order that's overdue",
];
