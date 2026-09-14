# Handoff — The Hallow Archive

Last updated: 2026-09-13

## Where things stand

**Live app:** https://the-hallow-gilt.vercel.app
**Repo:** https://github.com/8bitshinobi/TheHallow (main branch, auto-deploys via Vercel on push)
**Backend:** Supabase project `xlkhkomddvfwdrpqfmbi` (Postgres + Auth). Schema in `supabase/migrations/0001_init.sql`.
**Local dev:** `npm run dev`, needs `.env.local` (see `.env.local.example`) — Project URL + Publishable key from Supabase dashboard → Project Settings → API Keys. A `SUPABASE_SECRET_KEY` also lives in `.env.local`, used only by the scripts in `scripts/migrate/` (never by the app itself, never committed).

v1 scope (per the original plan): Scott-only admin app, no player accounts/suggestion queue yet — that's still a deferred phase 2.

## What's built

- **Object/connection model**: `objects` (id, type, name, JSONB `properties`) + `edges` (from_id, to_id, optional label), per CLAUDE.md's design philosophy. Types are free-form strings, not an enum.
- **Auth**: Supabase email/password, single account (Scott's), gated via `proxy.ts`.
- **Object CRUD**: list with type filter (`/objects`), create (`/objects/new`), detail view (`/objects/[id]`) with a grouped, collapsible properties editor (dot-prefix key convention, e.g. `taxonomy.kingdom`, groups into collapsible sections) and connection picker/unlink.
- **Graph visualization** (`components/GraphCanvas.tsx`) — the most iterated-on piece:
  - Per-object graph (`/objects/[id]/graph`) and whole-archive graph, now also embedded side-by-side with the object list on `/objects` itself, filtered to match whatever type filter is active there.
  - Force-directed layout (`d3-force`), rendered as hand-rolled SVG (no chart library).
  - Idle nodes drift continuously (slow per-node sine-wave motion, never pauses — pausing on hover used to cause a visible jump on mouse-out).
  - Hover-to-focus: 4 depth tiers by graph distance from the hovered node (focus / secondary / tertiary / fourth), each with its own scale (via a perspective formula, not hardcoded per-tier) and opacity. Secondary nodes get an extra 1.8x scale bump specifically during an active hover.
  - Edge opacity follows the same tier rule as nodes (an edge takes its farther endpoint's tier), with edges touching the focused node staying fully opaque.
  - Node scale transitions cascade: the focused node moves instantly, every other node's start time is independently randomized (not tiered/layered — that was tried and explicitly walked back) within a ~0.35s window, using a steep easing curve (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Nodes have a solid backing circle (`fill: var(--background)`) so dimmed/translucent nodes don't show connection lines bleeding through their own body.
  - Node hit-zone (invisible click/hover target) is padded at rest, shrinks to the node's actual radius once focused, and is pinned to a stable anchor point (not the live drifting position) specifically to avoid a hover flicker bug.
  - Node labels are off by default (`SHOW_LABELS` — was causing overlap clutter) but the underlying `graphLabel` system is built: objects can set an optional `properties.label` for a short 1-2 word display name, falling back to the first couple words of the full name.

## Data migrated so far

**The Dimension — RPG Setting Bible** (from Notion, "Art Story Design" workspace): fully migrated as 22 linked objects, via `scripts/migrate/dimension-setting-bible.mjs`.
- 7 lore (Setting Overview, The Hallow — World Itself, Cosmology & The Singularity, The Filtering System, Terminal Emotions & The Loop, Regions & Locations, The Surface Layer — Factions & Greed)
- 7 more lore, tagged `category: "Terminal Archetype"` (The Power Hungry, The Stoic Warrior, The Perfectionist, The Martyr, The Nostalgic, The Cynic, The Collector), each with a `protector_type` (Exile/Manager/Firefighter)
- 1 npc (The Wizard — true identity withheld per the setting's own reveal structure)
- 2 place (The Graveyard of Broken Promises; The Loop Region (Mother & Son), flagged `status: in_development`)
- 1 production_notes (Inspirations & Tone — meta-commentary, not in-world, same treatment as the Emberdart PDF's Lumo notes)
- 1 campaign_arc (new type — The Surface Arc — Levels 1–10 & The Fabricated Mythologies)
- 4 organization stubs (Witches of Astra, Custodians of the Veil, Verdant Iron, Brothers Quimby) — named in the Surface Arc's example thread but their full detail lives in Capacities, not yet migrated; each flagged `status: stub — pending Capacities migration`

Decisions made for this pass: per-category object types (not generic `lore` for everything); whole Setting Bible in one pass (it's tightly cross-referenced); the **Game Mechanics — DC20 Integration** page was explicitly skipped, per CLAUDE.md's DC20-is-a-separate-pool rule — revisit once a dedicated DC20-supplement workflow exists.

Also found two pages not listed in the previous handoff note (only referenced in the Setting Bible's Quick Navigation, found via full fetch): "The Filtering System" (migrated) and "The Dimension as a Place" (does not actually exist as a page yet — aspirational nav bullet only, nothing to migrate).

**Codex Chimerical — Emberdart** (from `Emberdart.md` and later `Emberdart.pdf`, which turned out to be the same content plus some extras): fully migrated as 18 linked objects —
- 1 creature (Emberdart, properties grouped into taxonomy/vitals/mechanics/narrative)
- 3 npc (Rangard Ricker, Succa Dogwood, Panthy Weatherbee)
- 1 organization (Triumvirate of Understanding)
- 1 lore (origin myth)
- 3 field_journal (Rangard's, Succa's, Succa's rebuttal)
- 1 curator_notes (Weatherbee's Menagerie Notes)
- 4 adventure_hook (from the PDF's hook suggestions)
- 3 idea_seed (Storm-charged Emberdart variant, Cult of the Emberdart, Obsidian Hawk predator)
- 1 production_notes (the PDF's "Notes / From Lumo" presentation/mechanics suggestions — kept as its own type since it's meta-commentary, not in-world lore)

Migration scripts live in `scripts/migrate/` (`lib.mjs` has the reusable `findOrCreateObject`/`linkObjects` helpers; run with `node --env-file=.env.local scripts/migrate/<file>.mjs`). No other Codex Chimerical creatures migrated yet.

## In progress / paused

**Notion migration**: The Dimension — RPG Setting Bible is done (see "Data migrated so far" above). This directly resolves CLAUDE.md's open question "whether The Dimension needs its own content" — yes, clearly.

Not yet touched from Notion:
- **Game Mechanics — DC20 Integration** page — deliberately skipped per CLAUDE.md's DC20-is-a-separate-pool rule. Revisit once a dedicated DC20-supplement workflow exists (own type + linked edge, most likely).
- Rest of the "Art Story Design" Notion workspace beyond the Setting Bible — not yet surveyed.

Also still open, from Capacities (not Notion): the four organization stubs created during this pass (Witches of Astra, Custodians of the Veil, Verdant Iron, Brothers Quimby) need their full detail — vault/lock mechanics, NPCs, encounters — migrated in from Capacities and merged into the existing stub objects (`findOrCreateObject` will merge safely, existing stub properties win on conflict so re-run is safe, but the stub's placeholder `description`/`status` properties should get overwritten with real content, not just merged around).

## Known rough edges / deferred

- Node labels (`SHOW_LABELS`) are off in the graph — works, just needs a real solution for label overlap before re-enabling broadly.
- `PropertiesEditor`'s "add property" using an empty-string key can collide if two rows are mid-edit with the same blank/duplicate key (acceptable for personal-scale use, not a real bug fix priority).
- Player accounts / suggestion queue (canon vs. pending status) — full phase 2, not started.
