"use client";

import { forceCollide, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";
import type { GraphEdge, GraphNode } from "@/lib/types";

// Canvas/WebGL only — no DOM to render on the server.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  centerId?: string;
  // "recenter": clicking a neighbor navigates to *its* graph view (the
  // center node instead links to its own detail page). "detail": every
  // node links straight to its detail page.
  linkMode: "recenter" | "detail";
};

// Depth tiers by graph distance from the hovered node: 0 = the hovered node
// itself, 1 = its direct connections, 2 = two hops out, 3 = everything else.
// z is a "distance from camera" value (negative = closer), reused for a
// simple perspective scale below.
const DEPTH_TIERS: Record<0 | 1 | 2 | 3, { z: number; opacity: number }> = {
  0: { z: -100, opacity: 1 },
  1: { z: 0, opacity: 0.75 },
  2: { z: 50, opacity: 0.5 },
  3: { z: 90, opacity: 0.25 },
};

// Simple perspective projection (scale = cameraDistance / (cameraDistance +
// z)), so "closer" (negative z) reads as bigger and "further" (positive z)
// as smaller.
const CAMERA_DISTANCE = 140;

function scaleForZ(z: number): number {
  return CAMERA_DISTANCE / (CAMERA_DISTANCE + z);
}

// How much bigger a direct connection of the hovered node gets, overriding
// its z-derived scale (which would otherwise be 1x, i.e. unchanged).
const SECONDARY_HOVER_SCALE = 1.8;

/** BFS distance (capped at 3) from the hovered node, per node id. Everyone is tier 1 ("at rest") when nothing is hovered. */
function computeDepthTiers(
  hoveredId: string | null,
  nodeIds: string[],
  edges: GraphEdge[]
): Map<string, 0 | 1 | 2 | 3> {
  const tiers = new Map<string, 0 | 1 | 2 | 3>();

  if (!hoveredId) {
    for (const id of nodeIds) tiers.set(id, 1);
    return tiers;
  }

  const adjacency = new Map<string, string[]>();
  for (const id of nodeIds) adjacency.set(id, []);
  for (const edge of edges) {
    adjacency.get(edge.from)?.push(edge.to);
    adjacency.get(edge.to)?.push(edge.from);
  }

  tiers.set(hoveredId, 0);
  let frontier = [hoveredId];
  for (let depth = 1; depth <= 2; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adjacency.get(id) ?? []) {
        if (!tiers.has(neighbor)) {
          tiers.set(neighbor, depth as 1 | 2);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }

  for (const id of nodeIds) {
    if (!tiers.has(id)) tiers.set(id, 3);
  }

  return tiers;
}

// Deterministic color per object type, so new free-form types (there's no
// fixed enum — see CLAUDE.md) automatically get a stable, distinct color
// without needing a hardcoded per-type list.
const PALETTE = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function colorForType(type: string): string {
  return PALETTE[hashString(type) % PALETTE.length];
}

// Duration/curve for animating a node's scale and opacity toward whatever
// its target became after a hover change. A steep deceleration (most of the
// change happens fast, up front) reads punchier than a plain ease-out.
const TRANSITION_MS = 320;
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

type ValueTransition = { from: number; to: number; start: number };

// Generic "ease this id's value toward whatever target it's given right
// now" tracker. Reused for both scale and opacity so a hover change eases
// both in lockstep. Reading `performance.now()` fresh on every call (rather
// than once per React render) is what lets this animate smoothly across
// several *repainted* frames from a single hover-triggered render — see
// the force-repaint effect below, which is what actually causes those
// extra frames to happen at all.
function animatedValue(
  transitions: Map<string, ValueTransition>,
  id: string,
  target: number
): number {
  const now = performance.now();
  let t = transitions.get(id);
  if (!t) {
    t = { from: target, to: target, start: now };
    transitions.set(id, t);
    return target;
  }
  if (t.to !== target) {
    // Re-anchor from wherever the animation currently sits (not from the
    // old target) so retargeting mid-transition doesn't jump.
    const elapsed = Math.min(1, (now - t.start) / TRANSITION_MS);
    t.from = t.from + (t.to - t.from) * easeOutQuint(elapsed);
    t.to = target;
    t.start = now;
  }
  const elapsed = Math.min(1, (now - t.start) / TRANSITION_MS);
  return t.from + (t.to - t.from) * easeOutQuint(elapsed);
}

// Render-time-only "push" offset, so hovering a node visually shoves nearby
// nodes aside without touching the underlying d3-force simulation (the
// earlier attempt at this drove it through the simulation itself - growing
// the collide radius and calling d3ReheatSimulation() - which reset the
// simulation's alpha to 1 and re-armed every force, not just collide, so
// the whole graph visibly reorganized instead of a local nudge; reverted
// twice, see the comment above the force-setup effect below). This is the
// same "pull when far, push when close" idea from
// https://www.deconbatch.com/2023/11/pushpull01.html.html, pared down to
// push-only (no pull - an unhovered node drifting toward the cursor would
// read as wrong) and phrased with a direction vector instead of
// heading/cos/sin. Magnitude is naturally bounded: at zero separation
// `d` bottoms out at -1, so the offset never exceeds PUSH_STRENGTH no
// matter how close two nodes get. Verified against the real migrated data
// (both a low-degree and a high-degree ~7-neighbor hub): pushed neighbors
// fan out cleanly, edges and hit-testing track the offset correctly, and
// un-hovering resets instantly with no residual drift, since nothing here
// is stateful — it's recomputed fresh every frame from the current hover
// id alone. This only pushes a node away from the *hovered* node, though —
// see computeVisualPositions below for the pass that also keeps two
// bumped-up neighbors from overlapping each other.
const PUSH_GAP = 4;
const PUSH_STRENGTH = 26;

function pushOffset(
  x: number,
  y: number,
  radius: number,
  moverX: number,
  moverY: number,
  moverRadius: number
): { dx: number; dy: number } {
  const awayX = x - moverX;
  const awayY = y - moverY;
  const dist = Math.hypot(awayX, awayY) || 0.001;
  const baseDist = moverRadius + radius + PUSH_GAP;
  const d = (dist - baseDist) / baseDist;
  if (d >= 0) return { dx: 0, dy: 0 };
  const magnitude = -d * PUSH_STRENGTH;
  return { dx: (awayX / dist) * magnitude, dy: (awayY / dist) * magnitude };
}

type Bounds = { xMin: number; xMax: number; yMin: number; yMax: number };

// A custom d3-force "wall". d3-force's tick loop calls every registered
// force to accumulate vx/vy, THEN — once, after all forces have run —
// applies its own `x += vx` integration step. A force that sets `x`/`y`
// directly (as an earlier version of this did) gets silently overwritten
// by that automatic step, since it runs after every force, letting a
// node escape whenever an ordinary tick's velocity was large enough
// (exactly what happens right when a hovered node's collision radius
// jumps and shoves a neighbor hard). The fix is to predict where the
// existing velocity would land the node this tick and, if that's past an
// edge, replace vx/vy with exactly the delta needed to land ON the edge
// instead — so the boundary is respected by the same integration step
// every other force relies on, not fought against after the fact.
function forceBounds(bounds: Bounds) {
  let nodes: (SimulationNodeDatum & { vx?: number; vy?: number })[] = [];
  function force() {
    for (const n of nodes) {
      if (n.x === undefined || n.y === undefined) continue;
      const vx = n.vx ?? 0;
      const vy = n.vy ?? 0;
      const nextX = n.x + vx;
      const nextY = n.y + vy;
      if (nextX < bounds.xMin) n.vx = bounds.xMin - n.x;
      else if (nextX > bounds.xMax) n.vx = bounds.xMax - n.x;
      if (nextY < bounds.yMin) n.vy = bounds.yMin - n.y;
      else if (nextY > bounds.yMax) n.vy = bounds.yMax - n.y;
    }
  }
  force.initialize = (n: typeof nodes) => {
    nodes = n;
  };
  return force;
}

// #rrggbb -> "r, g, b", so callers can build an rgba(...) string at
// whatever opacity the current depth tier calls for.
function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

// Canvas fillStyle doesn't understand CSS custom properties the way an SVG
// `fill` attribute does — "var(--background)" is just an invalid color
// string on a 2D context. --background itself only ever changes via the
// "prefers-color-scheme" media query (see globals.css), not a runtime
// class toggle, so re-reading it on that query's change event keeps this
// in sync with the OS theme without polling.
function subscribeColorScheme(onChange: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function readBackgroundColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
}

function useBackgroundColor(): string {
  return useSyncExternalStore(subscribeColorScheme, readBackgroundColor, () => "#ffffff");
}

type FGNode = GraphNode & { x?: number; y?: number };

export function GraphCanvas({ nodes, edges, centerId, linkMode }: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const backgroundColor = useBackgroundColor();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  // ForceGraph2D is a dynamic (ssr:false) import, so on first mount its
  // underlying instance can genuinely not exist yet by the time other
  // effects run — an object ref alone gives no signal for "it just became
  // available." Without this, an effect that bails out on `!fgRef.current`
  // during that window (as the force-setup effect below does) never gets a
  // second chance to run: nothing else changes its dependencies, so the
  // custom forces (collide, tuned link/charge, the bounding-box wall) can
  // silently never attach at all, for the lifetime of the component — a
  // real, previously-undiscovered bug (the library's own ref type only
  // accepts a plain MutableRefObject, not a callback ref, so a poll is
  // used instead of a ref-callback to detect the transition). Flips
  // exactly once, giving the dependent effects below a reason to re-run.
  const [fgReady, setFgReady] = useState(false);
  useEffect(() => {
    if (fgRef.current) {
      setFgReady(true);
      return;
    }
    let rafId: number;
    function check() {
      if (fgRef.current) {
        setFgReady(true);
        return;
      }
      rafId = requestAnimationFrame(check);
    }
    rafId = requestAnimationFrame(check);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function hrefFor(id: string): string {
    if (linkMode === "detail" || id === centerId) return `/objects/${id}`;
    return `/objects/${id}/graph`;
  }

  function radiusFor(id: string): number {
    return id === centerId ? 10 : 6;
  }

  // A square "wall" the layout can't spread past, sized to roughly match
  // (with room to breathe) how much space this many nodes naturally settle
  // into — a fixed floor so a small graph doesn't get squeezed, growing
  // with node count so a much bigger graph still gets a proportionally
  // bigger box rather than a fixed one that would over-compress it.
  const bounds = useMemo<Bounds>(() => {
    const half = Math.max(140, Math.sqrt(nodes.length) * 28);
    return { xMin: -half, xMax: half, yMin: -half, yMax: half };
  }, [nodes.length]);

  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const depthTiers = useMemo(
    () => computeDepthTiers(hoveredId, nodeIds, edges),
    [hoveredId, nodeIds, edges]
  );

  function scaleFor(id: string): number {
    const tier = depthTiers.get(id) ?? 1;
    if (hoveredId !== null && tier === 1) return SECONDARY_HOVER_SCALE;
    return scaleForZ(DEPTH_TIERS[tier].z);
  }

  // Animated (eased-toward-target) counterparts of scaleFor and each
  // tier's opacity — these are what actually get drawn with and fed into
  // computeVisualPositions below, so growing/shrinking, fading, and the
  // push-apart effect all ease in lockstep instead of snapping. The Maps
  // persist across renders (a ref, not state) since this is per-node
  // animation progress, not something a re-render should reset.
  const scaleTransitionsRef = useRef<Map<string, ValueTransition>>(new Map());
  const opacityTransitionsRef = useRef<Map<string, ValueTransition>>(new Map());

  function animatedScaleFor(id: string): number {
    if (reduceMotion) return scaleFor(id);
    return animatedValue(scaleTransitionsRef.current, id, scaleFor(id));
  }

  function animatedRadiusFor(id: string): number {
    return radiusFor(id) * animatedScaleFor(id);
  }

  function animatedOpacityFor(id: string): number {
    const tier = depthTiers.get(id) ?? 1;
    const target = DEPTH_TIERS[tier].opacity;
    if (reduceMotion) return target;
    return animatedValue(opacityTransitionsRef.current, id, target);
  }

  // graphData identity must stay stable across renders (the engine keeps
  // its own copy of these objects and mutates them with x/y/vx/vy as the
  // simulation runs) — only rebuild it when the actual node/edge set
  // changes, not on every hover-driven re-render.
  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n })) as FGNode[],
      links: edges.map((e) => ({ ...e })),
    }),
    [nodes, edges]
  );

  // graphData.nodes are the exact objects the engine mutates in place each
  // tick, so this map's entries stay live (.x/.y current) without needing
  // to be rebuilt every frame - only when the node/edge set itself changes.
  const nodeById = useMemo(() => {
    const map = new Map<string, FGNode>();
    for (const n of graphData.nodes) map.set(n.id, n);
    return map;
  }, [graphData]);

  // Visual (render-time only, no physics) positions for this frame: start
  // from the settled simulation position, push everything away from the
  // hovered node's grown radius, then resolve any overlap left between
  // *any* pair of nodes — not just each one's distance from the hovered
  // node. That second pass matters because pushOffset alone only
  // guarantees a node clears the hovered node itself; two of its
  // neighbors, both bumped up to SECONDARY_HOVER_SCALE, can easily still
  // be too close to *each other* after that first pass, since neither one
  // was ever checked against the other. A few Gauss-Seidel-style
  // relaxation passes are enough to settle a few dozen nodes; the hovered
  // node itself is never moved by either pass, so it stays the fixed
  // visual anchor everything else arranges around.
  const OVERLAP_GAP = 4;
  const OVERLAP_ITERATIONS = 3;

  // How much a node's own *label* sticks out past its circle — a label is
  // usually far wider than the dot it's attached to, so spacing nodes
  // apart by circle radius alone (as computeVisualPositions used to)
  // leaves plenty of room between the dots while their text still
  // overlaps. Measured with the real canvas context and the exact font
  // each label draws with (see the matching onRenderFramePost above), not
  // estimated, so it tracks each node's actual name length.
  function labelHalfExtentFor(ctx: CanvasRenderingContext2D, id: string): number {
    const tier = depthTiers.get(id) ?? 1;
    const isHovered = id === hoveredId;
    const isNeighbor = tier === 1 && hoveredId !== null;
    if (!isHovered && !isNeighbor) return 0;
    const node = nodeById.get(id);
    if (!node) return 0;
    ctx.font = `${isHovered ? 6 : 4.5}px sans-serif`;
    let width = ctx.measureText(node.graphLabel ?? node.name).width;
    if (isHovered) {
      ctx.font = "3px sans-serif";
      width = Math.max(width, ctx.measureText(node.type).width);
    }
    return width / 2;
  }

  // The radius used for *spacing* nodes apart — bigger than the drawn
  // circle whenever a label is attached, so pushing/overlap-resolution
  // below treats a labeled node as roughly as wide as its own text.
  function spacingRadiusFor(ctx: CanvasRenderingContext2D, id: string): number {
    return animatedRadiusFor(id) + labelHalfExtentFor(ctx, id);
  }

  function computeVisualPositions(
    ctx: CanvasRenderingContext2D
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    for (const node of graphData.nodes) {
      if (node.x === undefined || node.y === undefined) continue;
      positions.set(node.id, { x: node.x, y: node.y });
    }

    if (hoveredId) {
      const mover = positions.get(hoveredId);
      if (mover) {
        for (const [id, pos] of positions) {
          if (id === hoveredId) continue;
          const { dx, dy } = pushOffset(
            pos.x,
            pos.y,
            spacingRadiusFor(ctx, id),
            mover.x,
            mover.y,
            spacingRadiusFor(ctx, hoveredId)
          );
          pos.x += dx;
          pos.y += dy;
        }
      }
    }

    const ids = [...positions.keys()];
    for (let iteration = 0; iteration < OVERLAP_ITERATIONS; iteration++) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const idA = ids[i];
          const idB = ids[j];
          const a = positions.get(idA)!;
          const b = positions.get(idB)!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const minDist = spacingRadiusFor(ctx, idA) + spacingRadiusFor(ctx, idB) + OVERLAP_GAP;
          if (dist >= minDist) continue;
          const overlap = minDist - dist;
          const ux = dx / dist;
          const uy = dy / dist;
          const aFixed = idA === hoveredId;
          const bFixed = idB === hoveredId;
          if (aFixed && bFixed) continue;
          if (aFixed) {
            b.x += ux * overlap;
            b.y += uy * overlap;
          } else if (bFixed) {
            a.x -= ux * overlap;
            a.y -= uy * overlap;
          } else {
            a.x -= (ux * overlap) / 2;
            a.y -= (uy * overlap) / 2;
            b.x += (ux * overlap) / 2;
            b.y += (uy * overlap) / 2;
          }
        }
      }
    }

    return positions;
  }

  // Recomputed inside onRenderFramePre (once per actual repainted frame)
  // rather than called directly here (once per React render) — the ref
  // lets it pick up each new animation-frame's progress even during the
  // several *extra* repaints the force-repaint effect below triggers
  // between React renders, which is what makes the push/overlap
  // repositioning above animate smoothly instead of snapping straight to
  // its end state the instant a hover starts.
  const visualPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Labels are queued here during nodeCanvasObject (once per node, in
  // whatever order the library iterates them — not z-order aware) and
  // actually drawn later, in onRenderFramePost, once every node's circle
  // for this frame has already been painted. Without this split, a label
  // could end up drawn before a *later* node's circle and get visually
  // covered by it, since nodeCanvasObject has no way to control draw order
  // across different nodes on its own.
  type PendingLabel = { x: number; y: number; text: string; fontSize: number; color: string };
  const pendingLabelsRef = useRef<PendingLabel[]>([]);

  // Nothing else causes a repaint while a hover-triggered transition is
  // in flight — react-force-graph-2d only actually redraws in response to
  // an engine tick, a zoom/pan, or a handful of its own internal setters,
  // not merely because a prop function's identity changed. `zoom(zoom())`
  // re-applies the *current* zoom level as a deliberate no-op change, but
  // it still flags the library's internal "needs redraw" state, which is
  // the cheapest public way to say "please repaint" without reheating the
  // simulation (which would re-arm real physics, not just repaint).
  useEffect(() => {
    if (reduceMotion) return;
    let rafId: number;
    const deadline = performance.now() + TRANSITION_MS + 50;
    function tick() {
      const fg = fgRef.current;
      if (fg) fg.zoom(fg.zoom());
      if (performance.now() < deadline) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hoveredId, reduceMotion]);

  // Force setup — link distance/charge/collide tuned to the same "tight
  // clusters, disconnected components kept in the same neighborhood"
  // character established earlier, just running as a live simulation
  // instead of a one-shot 300-tick layout. Deliberately static (resting
  // radius only, no hover dependence, no reheating on hover). Tried twice
  // and reverted both times: making a hovered node's growth dynamically
  // resize the collide force and reheating on every hover change was meant
  // to let neighbors get physically shoved aside, but d3ReheatSimulation()
  // resets alpha to 1 — every force fires at full strength again, not just
  // collide, so it's closer to re-running the whole layout than nudging
  // one local collision. First attempt (no wall) let the whole graph drift
  // further on every hover; second attempt (with the wall in place, and a
  // real forceBounds bug fixed along the way) no longer let anything
  // escape, but the whole cluster still visibly reorganized on hover — the
  // wall fixed the escape, not the underlying over-reaction. A version of
  // this worth revisiting would need to sidestep the simulation entirely
  // (a purely visual, render-time offset for drawing only, with its own
  // custom link-drawing so edges follow it) rather than driving it through
  // reheat.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("x", forceX(0).strength(0.08));
    fg.d3Force("y", forceY(0).strength(0.08));
    fg.d3Force(
      "collide",
      forceCollide((node: SimulationNodeDatum & { id?: string | number }) =>
        radiusFor(node.id as string) + 6
      ).strength(1)
    );
    const charge = fg.d3Force("charge");
    if (charge && "distanceMax" in charge) {
      (charge as unknown as { distanceMax: (d: number) => void }).distanceMax(130);
    }
    const link = fg.d3Force("link");
    if (link && "distance" in link) {
      (link as unknown as { distance: (d: number) => void }).distance(26);
    }
    // The wall: registered alongside the other forces (not deferred until
    // after settling) so it's a real constraint on how the layout can
    // develop, not just a box drawn around wherever things ended up.
    fg.d3Force("bounds", forceBounds(bounds));
    fg.d3ReheatSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, bounds, fgReady]);

  // Camera framing — the engine has no built-in "fit to content" on its
  // own; left alone it renders at a fixed 1 graph-unit = 1 pixel scale
  // centered on graph coordinate (0,0), which (like the very first SVG
  // viewBox bug) shows the settled cluster as a tiny speck in a mostly
  // empty canvas. onEngineStop fires whenever the simulation settles —
  // including after a hover-triggered reheat — so this only re-fits on
  // the FIRST settle (the initial layout); a hover shouldn't yank the
  // camera around.
  const hasFitRef = useRef(false);
  useEffect(() => {
    hasFitRef.current = false;
  }, [graphData]);

  if (nodes.length <= 1) {
    return <p className="text-sm text-black/50 dark:text-white/50">No connections yet.</p>;
  }

  return (
    <div ref={containerRef} className="h-[750px] w-full overflow-hidden">
      {containerSize ? (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={containerSize.width}
          height={containerSize.height}
          backgroundColor="rgba(0,0,0,0)"
          linkSource="from"
          linkTarget="to"
          warmupTicks={300}
          cooldownTime={reduceMotion ? 0 : 4000}
          enableNodeDrag={false}
          onEngineStop={() => {
            if (hasFitRef.current) return;
            hasFitRef.current = true;
            // This is a one-time fit — the camera deliberately never moves
            // again on hover (see the comment above), so it has to be
            // framed generously enough up front to cover the *largest*
            // a node can ever get, not just the resting layout. The
            // per-object view's center node has a bigger base radius (10
            // vs 6) and is exactly the node most likely to be hovered, so
            // at full focus scale it grows noticeably larger than any node
            // in the whole-archive view ever does — padding tuned for that
            // case clips its own label and its neighbors' off the edges.
            fgRef.current?.zoomToFit(400, centerId ? 150 : 40);
          }}
          onRenderFramePre={(ctx) => {
            // Recomputed fresh every actual repainted frame (not once per
            // React render) so the eased scale feeding into it is always
            // read at that frame's own timestamp.
            visualPositionsRef.current = computeVisualPositions(ctx);
            pendingLabelsRef.current = [];

            // ctx is already in graph-coordinate space here (same space
            // node.x/node.y are drawn in), so the wall's own bounds can be
            // stroked directly with no conversion.
            ctx.save();
            ctx.strokeStyle = "rgba(128, 128, 128, 0.35)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(
              bounds.xMin,
              bounds.yMin,
              bounds.xMax - bounds.xMin,
              bounds.yMax - bounds.yMin
            );
            ctx.restore();
          }}
          onRenderFramePost={(ctx) => {
            // Drawn after every node's circle for this frame (see the
            // queueing comment by pendingLabelsRef above), so a label is
            // never covered by a node that happened to be painted after it.
            for (const label of pendingLabelsRef.current) {
              ctx.font = `${label.fontSize}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = label.color;
              ctx.fillText(label.text, label.x, label.y);
            }
          }}
          nodeLabel={() => ""}
          onNodeHover={(node) => setHoveredId((node as FGNode | null)?.id ?? null)}
          onNodeClick={(node) => router.push(hrefFor((node as FGNode).id))}
          nodeCanvasObject={(node, ctx) => {
            const id = (node as FGNode).id;
            const pos = visualPositionsRef.current.get(id);
            const x = pos?.x ?? node.x ?? 0;
            const y = pos?.y ?? node.y ?? 0;
            const tier = depthTiers.get(id) ?? 1;
            const opacity = animatedOpacityFor(id);
            const radius = animatedRadiusFor(id);
            const isCenter = id === centerId;
            const isHovered = id === hoveredId;
            const isNeighbor = tier === 1 && hoveredId !== null;
            const rgb = hexToRgb(colorForType((node as FGNode).type));

            // Solid backing first so a dimmed node's own translucent fill
            // doesn't let connection lines show through its body.
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = backgroundColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(${rgb}, ${opacity})`;
            ctx.fill();
            if (isCenter) {
              ctx.lineWidth = 1;
              ctx.strokeStyle = `rgba(128, 128, 128, ${opacity})`;
              ctx.stroke();
            }

            if (isHovered || isNeighbor) {
              const label = (node as FGNode).graphLabel ?? (node as FGNode).name;
              pendingLabelsRef.current.push({
                x,
                y: y + radius + 3,
                text: label,
                fontSize: isHovered ? 6 : 4.5,
                color: `rgba(255, 255, 255, ${opacity})`,
              });
              if (isHovered) {
                pendingLabelsRef.current.push({
                  x,
                  y: y + radius + 3 + 7,
                  text: (node as FGNode).type,
                  fontSize: 3,
                  color: `rgba(255, 255, 255, ${opacity * 0.7})`,
                });
              }
            }
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const id = (node as FGNode).id;
            const pos = visualPositionsRef.current.get(id);
            const x = pos?.x ?? node.x ?? 0;
            const y = pos?.y ?? node.y ?? 0;
            // A flat, generous padding regardless of tier — canvas
            // hit-testing is a dedicated per-pixel lookup (not overlapping
            // DOM elements), so there's no risk of two nearby hit zones
            // "flickering" against each other the way there was with the
            // old SVG version; it can just always be comfortably clickable.
            const radius = animatedRadiusFor(id) + 8;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          // Drawn manually (instead of linkColor/linkWidth) so a link's
          // endpoints follow the same render-time push offset as the nodes
          // themselves - otherwise a pushed node's edges would visibly
          // detach from it while hovering.
          linkCanvasObjectMode={() => "replace"}
          linkCanvasObject={(link, ctx) => {
            const source = link.source as FGNode | string;
            const target = link.target as FGNode | string;
            const fromNode = typeof source === "object" ? source : nodeById.get(source);
            const toNode = typeof target === "object" ? target : nodeById.get(target);
            if (fromNode?.x === undefined || fromNode.y === undefined) return;
            if (toNode?.x === undefined || toNode.y === undefined) return;

            const fromPos = visualPositionsRef.current.get(fromNode.id) ?? {
              x: fromNode.x,
              y: fromNode.y,
            };
            const toPos = visualPositionsRef.current.get(toNode.id) ?? {
              x: toNode.x,
              y: toNode.y,
            };

            const edgeOpacity = Math.max(animatedOpacityFor(fromNode.id), animatedOpacityFor(toNode.id));
            const isActive =
              hoveredId !== null && (fromNode.id === hoveredId || toNode.id === hoveredId);

            ctx.beginPath();
            ctx.moveTo(fromPos.x, fromPos.y);
            ctx.lineTo(toPos.x, toPos.y);
            ctx.strokeStyle = isActive
              ? "rgba(107, 114, 128, 1)"
              : `rgba(128, 128, 128, ${edgeOpacity * 0.4})`;
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();
          }}
        />
      ) : null}
    </div>
  );
}
