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
- **Graph visualization** (`components/GraphCanvas.tsx`) — the most iterated-on piece, **rewritten 2026-09-13** on `react-force-graph-2d` (canvas-rendered, `d3-force` underneath, dynamically imported with `ssr: false`). The previous version was hand-rolled SVG + CSS transitions doing its own force layout, perspective scaling, drift, and hover-triggered "push neighbors aside" animation; that last feature specifically kept breaking (a CSS transform-origin/attribute-transition desync caused edges to visibly detach from nodes) and the accumulating custom-animation coordination was judged not worth continuing to patch. Verified by hand against the real migrated data (41 objects/53 edges) via a temporary local-only preview route before shipping.
  - Per-object graph (`/objects/[id]/graph`) and whole-archive graph, embedded side-by-side with the object list on `/objects`, filtered to match whatever type filter is active there. Same public props as before (`nodes`, `edges`, `centerId?`, `linkMode`) — callers didn't need to change.
  - Force layout: link distance 26, charge -50/distanceMax 130, collide (resting radius + 6), weak x/y centering (0.08) so disconnected components (e.g. two unrelated migrated sources) stay in the same neighborhood instead of drifting arbitrarily far apart. `zoomToFit` runs once after the first settle (`onEngineStop`, guarded to fire only once) to frame the camera — the library has no built-in "fit to content," so without this the graph renders at a fixed 1-unit-to-1px scale that can leave most of the panel empty.
  - Hover-to-focus: same depth-tier concept as before (BFS distance from the hovered node → scale + opacity via a perspective formula), but now **purely visual** — drawn per-frame in `nodeCanvasObject`/`linkCanvasObject` from React hover state, no physics or CSS transitions involved. Canvas repaints on hover-state change without needing to reheat the simulation.
  - Deliberately **not implemented in this pass**: physically pushing other nodes out of the way when a hovered node grows. An initial attempt drove it through a live, hover-dependent `forceCollide` radius + `d3ReheatSimulation()` on every hover change, but with only a weak centering force, each reheat let the *whole* graph's position drift a little further, compounding into visible instability. Worth revisiting later as a deliberate, separate piece of work (e.g. a much stronger anchoring force, or damping reheat some other way) rather than folding into this rewrite.
  - Node hit-testing is the library's own per-pixel canvas hit-region (`nodePointerAreaPaint`), not overlapping DOM elements — this eliminates the old "hover hitbox floor" tuning problem entirely (there's no risk of two nearby invisible targets flickering against each other the way there was in the SVG version), so hit radius is just current-radius + a flat 8px pad, always.
  - Canvas `fillStyle` can't read CSS custom properties (`var(--background)` silently does nothing on a 2D context, unlike an SVG `fill` attribute) — the backing circle's color is read via `getComputedStyle` against `prefers-color-scheme`, mirroring the existing `useReducedMotion` pattern.
  - Idle drift (the old per-node sine-wave motion) and `SHOW_LABELS`/`graphLabel` fallback-truncation are **not carried over** in this rewrite — labels now always show for the hovered node + its direct neighbors, sized in absolute (not scale-compensated) canvas units. Revisit if the graph feels too static at rest.
  - Zoom/pan and node-drag are provided by the library; node-drag is explicitly disabled (`enableNodeDrag={false}`) to keep the layout consistent across visits rather than user-perturbable.

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
