# Handoff — The Hallow Archive

Last updated: 2026-09-14

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
  - Object type is a `<select>` of existing types (with a "+ Add new type" escape hatch), not free-text — free entry let case-variants like "NPC"/"npc" get created as separate types; filtering/grouping is also case-insensitive as a safety net.
  - Property text fields support `@mention` autocomplete (reusing the same object search): typing "@" inserts an inline `@[Name](id)` reference (`lib/mentions.ts`) and saving syncs a real edge, so a mention behaves like using the Connect panel — shows up in both objects' Connections list and the graph. Removing a mention from the text never retracts the edge. The dropdown also has a "+ Create '<name>'" row when nothing matches, opening a small inline form (same type-dropdown pattern as the main create form) to create and link a brand-new object on the spot.
- **Graph visualization** (`components/GraphCanvas.tsx`) — the most iterated-on piece, **rewritten 2026-09-13** on `react-force-graph-2d` (canvas-rendered, `d3-force` underneath, dynamically imported with `ssr: false`). The previous version was hand-rolled SVG + CSS transitions doing its own force layout, perspective scaling, drift, and hover-triggered "push neighbors aside" animation; that last feature specifically kept breaking (a CSS transform-origin/attribute-transition desync caused edges to visibly detach from nodes) and the accumulating custom-animation coordination was judged not worth continuing to patch. Verified by hand against the real migrated data (41 objects/53 edges) via a temporary local-only preview route before shipping — this has been the pattern for every graph change since, since the app needs real auth and there's no way to check it any other way.
  - Per-object graph (`/objects/[id]/graph`) and whole-archive graph, embedded side-by-side with the object list on `/objects`, filtered to match whatever type filter is active there. Same public props as before (`nodes`, `edges`, `centerId?`, `linkMode`) — callers didn't need to change.
  - Force layout: link distance 26, charge -50/distanceMax 130, collide (resting radius + 6), weak x/y centering (0.08) so disconnected components (e.g. two unrelated migrated sources) stay in the same neighborhood instead of drifting arbitrarily far apart. `zoomToFit` runs once after the first settle (`onEngineStop`, guarded to fire only once) to frame the camera — the library has no built-in "fit to content," so without this the graph renders at a fixed 1-unit-to-1px scale that can leave most of the panel empty.
  - **Bounding-box "wall"** (`forceBounds`, a custom d3-force): clamps the whole layout to a square that grows with node count (floor of 140, `sqrt(nodeCount) * 28`), drawn as a faint dashed rectangle. Registered as a real constraint alongside the other forces (not derived from the settled layout after the fact). Custom forces must adjust *velocity*, not set `x`/`y` directly — d3-force applies its own `x += vx` integration once, after every registered force has run, so a force that writes position directly gets silently overwritten by that step and a strong enough impulse can still escape. The fix: predict where the existing velocity would land the node this tick and replace vx/vy with exactly the delta needed to land on the edge instead.
  - Hover-to-focus: same depth-tier concept as before (BFS distance from the hovered node → scale + opacity via a perspective formula), drawn per-frame in `nodeCanvasObject`/`linkCanvasObject` from React hover state.
  - **Push-on-hover works now** (`pushOffset` + `computeVisualPositions`), as a purely render-time offset — no physics, no simulation state. A "pull when far, push when close" falloff (magnitude naturally bounded, never exceeds `PUSH_STRENGTH`) pushes everything away from the hovered node's grown radius, then a few Gauss-Seidel-style relaxation passes resolve any *remaining* overlap between every pair of nodes — not just each one's distance from the hovered node, which matters because two neighbors that both grow to `SECONDARY_HOVER_SCALE` can end up too close to each other even after the first pass. The hovered node itself is never moved by either step, staying the fixed visual anchor. All computed fresh every render from the current hover id and applied consistently to `nodeCanvasObject`, `nodePointerAreaPaint` (hit-testing), and a hand-drawn `linkCanvasObject` (edges must be drawn manually here, not via the library's default link renderer, or they'd visibly detach from a pushed node). Two earlier attempts drove this through the live simulation instead (growing the collide radius + `d3ReheatSimulation()` on hover) and both were reverted — `d3ReheatSimulation()` resets alpha to 1, re-arming *every* force, so it reorganizes the whole graph rather than nudging one local collision; the bounding-box wall fixed nodes escaping visibly but not that underlying over-reaction. Verified against the real data on both a low-degree and a ~7-neighbor hub: siblings that used to bunch together now settle into a clean, evenly-spaced ring and edges/hit-testing track the offset.
  - **Scale/opacity/push all animate** (`animatedValue`, ~320ms `easeOutQuint`, shared by scale and opacity), not snap — `computeVisualPositions` derives its push/overlap radii from the animated scale too, so growth, fading, and repositioning ease in lockstep from one time source. The non-obvious part: react-force-graph-2d only actually repaints on an engine tick, a zoom/pan, or a few of its own setters — not merely because a hover-triggered re-render passed new draw-callback closures — so a bare `useEffect` forces ~370ms of extra repaints per hover change via `fg.zoom(fg.zoom())` (a deliberate no-op zoom whose only real effect is flagging the library's internal "needs redraw" state, without reheating the simulation). Visual positions are recomputed inside `onRenderFramePre` into a ref (once per actually-repainted frame) rather than once per React render, which is what lets those forced repaints reflect newer animation progress at all. Verified directly (screenshot round-trip latency can't reliably catch a ~320ms transition) via a temporary per-frame console.log of the hovered node's radius: a clean 17-frame, ~270ms progression from 6.71 to 21.00 at 60fps.
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
