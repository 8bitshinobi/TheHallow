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

## Added types, generators, and public read access (2026-09-21)

Types added beyond the inventory above (types are free-form strings):
- **Regions** (`region`) vs **places** (`place`): regions are large areas (The
  Marrowlands); places are specific locations/settlements. A place with
  `category` Town/City counts as a *location* for the generators.
- **Taverns** (`tavern`) and **Businesses** (`business`, with a `category`
  property). Both are made by generator pages (`/taverns`, `/businesses`) that
  mix real "established" objects with procedurally generated ones; saved
  generations are private drafts. All generator content tables are placeholder
  filler, not canon.

**Public read access is opt-in per object.** A tavern/business is readable
without login (via `/api/places`, `/api/businesses`) only when its type matches
AND `properties.visibility = 'public'`, enforced by an RLS policy for the
`anon` role (migrations 0002/0003). The APIs return a whitelist of fields, so
GM-only properties (e.g. a business's `front_for`) are never exposed. There is
no anonymous write path; POST requires the login session.

**Icons:** shown for any object; resolved at display time from `properties.icon`
(manual override), then category, then type (`lib/icons.ts`). Never stored
automatically.

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
