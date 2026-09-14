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

**Notion migration**: Scott wants to bring in content from his Notion workspace ("Art Story Design") next. Found a substantial, already-structured source: **"🌀 The Dimension — RPG Setting Bible"**, with ~9-10 pages (Cosmology & The Singularity, The Wizard — Origin of the Dimension, The Filtering System, Terminal Emotions & The Loop, Regions & Locations, The Surface Layer — Factions & Greed, Game Mechanics — DC20 Integration, Inspirations & Tone, plus "The Hallow — The World Itself" and its child "The Surface Arc — Levels 1-10"). This directly resolves CLAUDE.md's open question "whether The Dimension needs its own content" — yes, clearly.

**Paused, not started**, pending Scott's decisions on:
1. Object typing — one type per category (cosmology, region, faction, game_mechanic, npc for The Wizard, etc.) vs. everything as generic `lore`.
2. Scope — the whole Setting Bible in one pass (it's tightly cross-referenced, so partial migration leaves dangling references) vs. starting smaller with just "The Hallow — World Itself".
3. The DC20 Integration page specifically — CLAUDE.md says DC20 should be a separate-but-linked pool, not merged into Hallow taxonomy, so this needs deliberate handling (own type + linked edge, or skip for now).

Next session: ask these questions again (they were dismissed mid-turn last time, not answered) before touching Notion content.

## Known rough edges / deferred

- Node labels (`SHOW_LABELS`) are off in the graph — works, just needs a real solution for label overlap before re-enabling broadly.
- `PropertiesEditor`'s "add property" using an empty-string key can collide if two rows are mid-edit with the same blank/duplicate key (acceptable for personal-scale use, not a real bug fix priority).
- Player accounts / suggestion queue (canon vs. pending status) — full phase 2, not started.
