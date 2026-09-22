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
  /** [name, base price in cp at a middle-class shop] */
  goods: [string, number][];
  roles: string[];
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
      ["horseshoes", 4],
      ["nails and hinges", 2],
      ["kitchen knives", 10],
      ["plowshares", 40],
      ["sword repair", 25],
      ["armor mending", 30],
      ["iron tools", 15],
      ["custom ironwork", 60],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["apprentice smith", "journeyman smith", "bellows-boy", "farrier", "delivery runner"],
    patrons: ["A soot-streaked apprentice on an errand", "A soldier waiting on a repair", "A farmer with a cracked plowshare"],
  },
  {
    name: "Stable",
    icon: "🐴",
    shop: "stable",
    nouns: ["Stables", "Livery", "Paddock", "Mews"],
    goods: [
      ["horses for hire (per day)", 20],
      ["mules and pack animals (per day)", 10],
      ["saddles and tack", 150],
      ["stabling by the night", 5],
      ["farrier services", 8],
      ["feed and hay (per day)", 3],
      ["cart rental (per day)", 15],
      ["riding lessons", 12],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["stable-hand", "groom", "farrier", "tack-maker", "night watch"],
    patrons: ["A courier changing horses in a hurry", "A merchant haggling over a mule", "A stable-boy asleep in the hay"],
  },
  {
    name: "Apothecary",
    icon: "🧪",
    shop: "apothecary",
    nouns: ["Apothecary", "Dispensary", "Mortar & Pestle", "Herbary"],
    goods: [
      ["herbal tinctures", 12],
      ["poultices and salves", 8],
      ["sleeping draughts", 20],
      ["dried herbs", 3],
      ["fever remedies", 15],
      ["bitters", 6],
      ["bandages and splints", 4],
      ["cough syrups", 7],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["herbalist", "apprentice", "dispenser", "herb-gatherer", "bookkeeper"],
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
      ["silver chains", 120],
      ["signet rings", 200],
      ["cut gemstones", 500],
      ["engraving", 15],
      ["appraisals", 20],
      ["mourning jewelry", 90],
      ["lockets", 80],
      ["brooches", 60],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["goldsmith", "gem-cutter", "apprentice", "clerk", "guard"],
    patrons: ["A nervous suitor choosing a ring", "A widow selling an heirloom", "A merchant having a stone appraised"],
  },
  {
    name: "General goods",
    icon: "🧺",
    shop: "general store",
    nouns: ["General Store", "Trading Post", "Emporium", "Mercantile"],
    goods: [
      ["rope and twine", 3],
      ["lamp oil", 4],
      ["candles", 1],
      ["sacks and barrels", 6],
      ["blankets", 20],
      ["cookware", 25],
      ["traveler's rations", 5],
      ["tools and hardware", 15],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["clerk", "stockhand", "delivery runner", "bookkeeper", "sweeper"],
    patrons: ["A farmer stocking up before the weather turns", "A traveler buying supplies for the road", "A child sent for a single candle"],
  },
  {
    name: "Tailor",
    icon: "🧵",
    shop: "tailor's shop",
    nouns: ["Tailors", "Threadworks", "Needle & Thread", "Haberdashery"],
    goods: [
      ["mended coats", 12],
      ["dyed cloaks", 45],
      ["uniforms", 80],
      ["wedding clothes", 300],
      ["hats and gloves", 20],
      ["alterations", 6],
      ["embroidered banners", 100],
      ["travel clothing", 60],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["seamstress", "apprentice", "cutter", "embroiderer", "errand-runner"],
    patrons: ["A bride's mother with strong opinions", "A soldier needing a uniform let out", "A merchant who wants to look wealthier than they are"],
  },
  {
    name: "Bakery",
    icon: "🥖",
    shop: "bakery",
    nouns: ["Bakery", "Oven", "Bread & Butter", "Hearth Loaf"],
    goods: [
      ["crusty loaves", 1],
      ["honey buns", 1],
      ["meat pies", 3],
      ["seed cakes", 2],
      ["festival pastries", 4],
      ["hardtack", 1],
      ["cheese rolls", 2],
      ["sweet rolls", 1],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["baker", "dough-mixer", "oven-tender", "shop-girl", "delivery runner"],
    patrons: ["An early riser queuing before dawn", "A cook buying bread for a hundred", "A child clutching a coin for a bun"],
  },
  {
    name: "Bookseller",
    icon: "📚",
    shop: "bookshop",
    nouns: ["Books", "Bindery", "Quill & Folio", "Scriptorium"],
    goods: [
      ["used volumes", 40],
      ["maps", 60],
      ["almanacs", 10],
      ["quills and ink", 5],
      ["blank journals", 25],
      ["letters written for hire", 8],
      ["pamphlets", 2],
      ["rare manuscripts", 800],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["clerk", "binder", "scribe", "apprentice", "cataloguer"],
    patrons: ["A scholar hunting one specific volume", "A clerk buying ink by the crate", "A traveler asking for the local map"],
  },
  {
    name: "Wine/Spirits",
    icon: "🍷",
    shop: "wine and spirits shop",
    nouns: ["Cellar", "Vintners", "Still", "Cask & Cork"],
    goods: [
      ["local wines (bottle)", 15],
      ["distilled spirits (bottle)", 30],
      ["casks by the barrel", 300],
      ["tasting flights", 10],
      ["bottled cordials", 20],
      ["imported vintages (bottle)", 80],
      ["brandy (bottle)", 40],
      ["corks and bottles", 2],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["cellar-master", "clerk", "cooper", "taster", "delivery runner"],
    patrons: ["A tavern-keeper restocking by the cask", "A collector arguing over a vintage", "A quiet regular who's never bought a full bottle"],
  },
  {
    name: "Pawnbroker",
    icon: "🏷️",
    shop: "pawnshop",
    nouns: ["Pawn", "Exchange", "Loan & Keep", "Second Hand"],
    goods: [
      ["secondhand tools", 8],
      ["unclaimed heirlooms", 100],
      ["loans against valuables (fee)", 10],
      ["used weapons", 40],
      ["odd jewelry", 50],
      ["cutlery", 6],
      ["musical instruments", 70],
      ["worn clothing", 5],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["clerk", "appraiser", "guard", "runner", "bookkeeper"],
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
      ["strange trinkets", 15],
      ["preserved specimens", 80],
      ["\"genuine\" relics", 200],
      ["small idols", 40],
      ["glass eyes", 25],
      ["dried oddities", 10],
      ["forged maps", 30],
      ["antique keys", 12],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["shopkeeper's assistant", "appraiser", "packer", "guard", "runner"],
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
      ["crates of foreign goods", 500],
      ["bulk spices (per lb)", 20],
      ["bolts of cloth", 80],
      ["barrels of oil", 60],
      ["tea chests", 150],
      ["cured meats (per side)", 40],
      ["storage by the week", 30],
      ["wholesale orders (deposit)", 100],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["warehouse clerk", "dock hand", "porter", "tally-keeper", "guard"],
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
      ["pots of tea", 3],
      ["sweet biscuits", 1],
      ["quiet corner (per hour)", 2],
      ["rare leaves (per oz)", 25],
      ["private booth (per hour)", 10],
      ["herbal blends", 6],
      ["small cakes", 2],
      ["afternoon service", 12],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["tea master", "server", "kitchen hand", "hostess", "doorman"],
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
      ["short loans (fee)", 20],
      ["coin changing (fee)", 2],
      ["letters of credit (fee)", 30],
      ["safekeeping in a strongbox (per month)", 15],
      ["appraisals", 20],
      ["ledger services", 25],
      ["mortgages (fee)", 100],
      ["currency exchange (fee)", 3],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["clerk", "bookkeeper", "guard", "collector", "runner"],
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
      ["coffins", 100],
      ["burial arrangements", 60],
      ["shrouds", 20],
      ["mourning clothes", 50],
      ["wake catering", 80],
      ["headstones", 150],
      ["grave-tending (per year)", 25],
      ["embalming", 90],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["gravedigger", "carpenter", "mourner-for-hire", "assistant", "driver"],
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
      ["hot baths", 5],
      ["steam rooms", 4],
      ["massages", 15],
      ["scented soaps", 3],
      ["barbering", 4],
      ["fresh towels", 1],
      ["private rooms", 25],
      ["herbal soaks", 8],
    ],
    /** Staff roles for this trade; a few are picked per business. */
    roles: ["attendant", "masseur", "barber", "laundress", "doorman"],
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

/** Categories that can have a hidden front at all (drives the "Fronts only" filter). */
export const FRONT_CAPABLE_CATEGORY_NAMES = CATEGORIES.filter((category) => category.front).map(
  (category) => category.name
);

/** Roles any business might employ, mixed in with the trade-specific ones. */
export const GENERIC_ROLES = ["clerk", "delivery runner", "night watch", "bookkeeper", "sweeper", "apprentice"];

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
