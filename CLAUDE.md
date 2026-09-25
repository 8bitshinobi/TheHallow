# The Hallow Archive — Project Instructions

## What this project is

A standalone web app to consolidate Scott's worldbuilding and campaign content into
one connected, accessible-anywhere system. This replaces scattered content currently
living in Notion, Capacities, plain notes, and prior Claude conversations.

This is a long-running, ongoing project with an intentionally unclear end vision.
Architecture should favor flexibility over premature rigidity — see "Design
Philosophy" below.

**Explicitly out of scope:** Castles & Crusades campaign content (Oppo Stonefist,
that campaign's lore) — not part of this project.

## World context

**The Hallow** — the umbrella world/setting (working name).

Origin: a planet struck by a beam of energy from space. The beam penetrated to the
core and filled it with power. That power caused the planet to expand, fracturing
and breaking the surface during the expansion. Sentient beings evolved/appeared over
time, leading to the present day.

Within The Hallow:
- **The Dimension** — a setting/campaign within the world (meta-aware, comedic pocket
  dimension, Dungeon Crawler Carl / Discworld inspired; Scott GMs this campaign).
- **Codex Chimerical** — a creature/lore sourcebook within the world. Five-tier
  classification system. Collaborator characters: Panthy Weatherbee, Rangard Ricker,
  Succa Dogwood.

**DC20** is a separate, system-specific layer — NOT native to The Hallow's lore.
Scott is open to generating DC20 supplements *from* Hallow content, but DC20 rules
content and Hallow world content should be modeled as two related-but-distinct pools,
linked only when a supplement/conversion is explicitly created — not merged into one
taxonomy. (The existing DC20 Field Guide reference site is a separate project/repo,
not part of this app, though the two may eventually link to each other.)

## Design philosophy

Scott organizes his thinking the way Capacities does: not folders, but connected
**objects** — people, places, ideas, projects that link to each other naturally. He
explicitly wants to see what connects to what. This is the core design principle for
this app, not a nice-to-have:

- Content is modeled as **objects** with a **type**, not as rigid per-type tables.
- Every object can **connect** to other objects, with connections readable in both
  directions (an NPC linked to an Organization shows up as a backlink on that
  Organization's page automatically).
- Connections can optionally carry a **label** describing the relationship (e.g.
  "ally of," "located in," "wields," "member of").
- Type-specific properties should be defined per-type rather than forcing every
  object into one giant sparse schema.
- Avoid locking in a rigid structure early — Scott's own vision for this app is
  still evolving, and the schema should be able to grow without a full rebuild.

## Content types (current inventory — expect this to evolve)

- **Places**
- **Organizations**
- **Items**
- **NPCs**
- **Creatures** — Codex Chimerical entries (related to, but distinct from, the DC20
  Bestiary)
- **Lore / setting entries** — cosmology, the five-tier classification system, etc.
  (fields still loosely defined — lower priority to formalize early)
- **Idea seeds** — unexplored ideas pulled from Scott's notes, need future
  development (fields still loosely defined)
- **Players / PCs** — player characters: identity, history, motivations,
  associations. Each PC has an **owner** (the player). Distinct from NPCs.

## Added types, generators, and public read access (2026-09-21, updated 2026-09-22)

Types added beyond the inventory above (types are free-form strings):
- **Regions** (`region`) vs **places** (`place`): regions are large areas (The
  Marrowlands); places are specific locations/settlements. A place with
  `category` Town/City counts as a *location* for the generators.
- **Taverns** (`tavern`) and **Businesses** (`business`, with a `category`
  property). Both are made by generator pages (`/taverns`, `/businesses`) that
  mix real "established" objects with procedurally generated ones. All
  generator content tables are placeholder filler, not canon, except the NPC
  generator's ancestry list, which is real DC20 rules content.
- **NPCs generated via `/npcs`** (standalone) and an in-place "Generate NPC"
  button on a place's innkeeper/proprietor field (Novice-tier DC20 stats,
  Magazine #3, stored under a `dc20.*` property group). Same
  established/procedural pattern as taverns/businesses. Ancestry uses DC20's
  15-ancestry list with the sub-rolls the rules require (Beastborn/Dragonborn/
  Fiendborn/Angelborn); Human/Elf/Dwarf are weighted 3x more common.

**Two separate ideas of "available," not one visibility flag:**
- **In-app (the generators' "established" pool)** is default-include: every
  object of that type is usable unless `properties.visibility = 'private'`.
  Saving from a generator no longer marks anything private — a saved object
  is just immediately usable in-app, not automatically public.
- **The anonymous public API** (`/api/places`, `/api/businesses`; none exists
  for NPCs) stays opt-in: readable without login only when `properties.visibility
  = 'public'`, enforced by an RLS policy for the `anon` role (migrations
  0002/0003). The APIs return a whitelist of fields, so GM-only properties
  (e.g. a business's `front_for`) are never exposed there. No anonymous write
  path; POST requires the login session.
- A literal "public by default" model was considered and rejected — it would
  let anyone with the site's public key read GM secrets straight from
  Postgres, bypassing the APIs' field whitelist entirely.

**Established results with blank fields get randomly filled in for display**
(tagged "rolled" in the UI, with a "Save rolled fields" action to make it
real) rather than shown sparse — this applies to all three generators. A list
field with *some* real content but fewer items than a full generation
produces gets topped up (new items appended, real ones never touched or
reordered) rather than treated as already-complete.

**Icons:** shown for any object; resolved at display time from `properties.icon`
(manual override), then category, then type (`lib/icons.ts`). Never stored
automatically.

**Theme:** the site is forced to a dark gray theme (`#242424`) for everyone,
regardless of OS light/dark preference (Scott's explicit choice, not a
default) — see `app/globals.css`'s `@custom-variant dark` and the permanent
`dark` class on `<html>` in `app/layout.tsx`.

## Plot / Compilation / Export (added 2026-09-25)

Lets Scott stage narrative-bearing objects into an ordered, exportable
"reading" — a compiled document built from selected objects, in a chosen
order, exported as RTF.

- **`arc`** and **`plot_beat`** are just object types (no schema change) —
  an arc is a top-level story-arc container; a plot beat is a chapter/beat
  within one. A plot beat links to its arc via a normal edge (label "part
  of"), same mechanism as any other connection. `/arcs` and `/arcs/[id]`
  are dedicated pages (`lib/compilations.ts`'s `listArcs`,
  `app/arcs/actions.ts`) with a "Plot beats in this arc" panel and a
  quick-create that creates the plot_beat object and links it to the arc in
  one step (`createPlotBeatInArc`). Editing an arc/plot beat's own
  properties still goes through the generic `/objects/[id]` page — `/arcs`
  only adds the arc-specific overview.
- **Any object type can carry `narrative_text`/`include_in_story`/
  `rough_era`/`level_range`/`status` properties** (cosmology entries, lore,
  plot beats, etc.) — these are plain properties through the existing
  generic `PropertiesEditor`, not a new form. `narrative_text` is the only
  field RTF export reads for prose; an entry's export **title** is
  `properties.title` if set, else the object's own `name` (the schema
  suggested a bare `properties.title`, but this app already has `name` as
  the canonical display name for every object — `title` is only an
  export-specific override when you want the compiled reading to show
  different wording than the in-app name).
- **`compilation`** is an object type whose contents live in a dedicated
  table, `compilation_entries` (migration `0004_compilation_entries.sql`),
  not in properties/edges — an object can be `draft`/`placed`/`cut` within
  a specific compilation, with a fractional `position` (meaningful only
  when `placed`) and a free-text `rough_era` bucket for grouping drafts.
  Built and managed entirely through `/compilations` and
  `/compilations/[id]` (`components/CompilationBuilder.tsx`,
  `components/CompilationEntryPicker.tsx`) — never through the generic
  object properties editor. Reordering is **move up/down buttons**, not
  drag-and-drop (Scott's choice — simpler and more reliable, especially on
  touch): each move swaps the `position` value between the two adjacent
  placed entries directly, rather than renumbering the whole list.
- **RTF export** (`lib/rtf.ts`, `exportCompilationRtf` in
  `app/compilations/actions.ts`): reads only `placed` entries in `position`
  order, builds a minimal one-font RTF document (heading + body paragraphs
  + page break per entry), and is downloaded client-side via a Blob — no
  new API route. Same authenticated-only access as the rest of the app; RTF
  export was not made part of the anonymous public API.
- **Not reconciled:** the Notion migration already created a
  `campaign_arc`-typed object ("The Surface Arc"), which predates and
  overlaps conceptually with the new `arc` type. Left as-is — deciding
  whether/how to merge them is Scott's call, not assumed here.

## Multi-user access: players and suggestions

Players (not just Scott) need access to this system, specifically to their own PC's
content. Model:

- Players have their own accounts/login — lightweight, scoped to their own PC.
- Players do **NOT** get direct edit rights on canon content.
- Players can **submit suggestions/additions** tied to their own PC.
- Scott (GM) reviews a **suggestion queue** and approves, edits, or rejects each
  submission before it merges into canon.
- Any object/field touched by this workflow needs a status distinction: canon vs.
  pending suggestion.

## Migration approach

- No need for automated import tooling up front — copy/paste from Capacities and
  notes into the new system is an acceptable starting strategy.
- Migrate one source at a time, not all at once. Suggested first source: content
  that's already well-structured (e.g. Codex Chimerical entries), to validate the
  object/connection model against real data before bulk migration.
- Capacities holds: Codex Chimerical campaign info — Places, Organizations, Items,
  Players (PCs), NPCs.
- Notes hold: idea seeds — unexplored concepts needing development.

## Tech stack (decided 2026-09-11)

- **Frontend/backend framework:** Next.js
- **Database/auth/storage:** Supabase (managed Postgres, built-in auth, file storage)
- **Hosting:** Vercel (frontend) + Supabase cloud (backend) — both have free tiers
  suitable for this project's scale
- **Data model implementation:** the object/connection model (see "Design
  Philosophy") maps to two core tables:
  - `objects` — id, type, flexible JSON/JSONB properties column (per-type shape
    without rigid per-type SQL tables)
  - `edges` — from_id, to_id, optional label (bidirectional connections; backlinks
    are a query on `to_id`)
- **Player scoping:** Postgres Row-Level Security (RLS) enforces that a player's
  account can only see/write suggestions tied to their own PC, rather than
  hand-rolled permission checks in application code.
- Chosen for: fully-managed/near-zero ops hosting, mainstream ecosystem (most
  future help/documentation available), and Postgres handling the adjacency-list
  graph pattern well at this scale. Considered and rejected: Convex (newer/smaller
  ecosystem, less certainty of longevity) and Firebase/Firestore (weaker fit for
  bidirectional graph queries).

## Open questions (do not assume — ask Scott)

- Field/property shape for Lore Entries and Idea Seeds (vaguer than Places/NPCs/Items)
- Hosting/deployment target — Scott will create any required accounts himself;
  Claude Code should generate deployment instructions, not attempt account creation
- Whether "The Dimension" needs its own content beyond what's captured under the
  general Hallow content types

## Working conventions

- Use a HANDOFF.md file for cross-session state (Scott's established pattern).
- Keep this CLAUDE.md updated as architectural decisions are made — it should
  reflect current reality, not the original plan, as the project evolves.
- Rule #1 (Scott's stated preference): no guessing or assuming — verify before
  presenting something as decided or accurate.
