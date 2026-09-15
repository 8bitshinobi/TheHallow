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

// SPIKE: render-time-only "push" offset, so hovering a node visually shoves
// nearby nodes aside without touching the underlying d3-force simulation
// (the earlier attempt at this drove it through the simulation itself -
// growing the collide radius and calling d3ReheatSimulation() - which
// reset the simulation's alpha to 1 and re-armed every force, not just
// collide, so the whole graph visibly reorganized instead of a local
// nudge; reverted twice, see the comment above the force-setup effect
// below). This is the same "pull when far, push when close" idea from
// https://www.deconbatch.com/2023/11/pushpull01.html.html, pared down to
// push-only (no pull - an unhovered node drifting toward the cursor would
// read as wrong) and phrased with a direction vector instead of
// heading/cos/sin. Magnitude is naturally bounded: at zero separation
// `d` bottoms out at -1, so the offset never exceeds PUSH_STRENGTH no
// matter how close two nodes get.
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

  function currentRadius(id: string): number {
    return radiusFor(id) * scaleFor(id);
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

  function pushOffsetForNode(id: string, x: number, y: number): { dx: number; dy: number } {
    if (!hoveredId || id === hoveredId) return { dx: 0, dy: 0 };
    const mover = nodeById.get(hoveredId);
    if (!mover || mover.x === undefined || mover.y === undefined) return { dx: 0, dy: 0 };
    return pushOffset(x, y, currentRadius(id), mover.x, mover.y, currentRadius(hoveredId));
  }

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
  }, [graphData, bounds]);

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
            fgRef.current?.zoomToFit(400, 40);
          }}
          onRenderFramePre={(ctx) => {
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
          nodeLabel={() => ""}
          onNodeHover={(node) => setHoveredId((node as FGNode | null)?.id ?? null)}
          onNodeClick={(node) => router.push(hrefFor((node as FGNode).id))}
          nodeCanvasObject={(node, ctx) => {
            const id = (node as FGNode).id;
            const simX = node.x ?? 0;
            const simY = node.y ?? 0;
            const { dx, dy } = pushOffsetForNode(id, simX, simY);
            const x = simX + dx;
            const y = simY + dy;
            const tier = depthTiers.get(id) ?? 1;
            const { opacity } = DEPTH_TIERS[tier];
            const radius = currentRadius(id);
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
              ctx.font = `${isHovered ? 6 : 4.5}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = `rgba(128, 128, 128, ${opacity})`;
              ctx.fillText(label, x, y + radius + 3);
              if (isHovered) {
                ctx.font = "3px sans-serif";
                ctx.fillText((node as FGNode).type, x, y + radius + 3 + 7);
              }
            }
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const id = (node as FGNode).id;
            const simX = node.x ?? 0;
            const simY = node.y ?? 0;
            const { dx, dy } = pushOffsetForNode(id, simX, simY);
            const x = simX + dx;
            const y = simY + dy;
            // A flat, generous padding regardless of tier — canvas
            // hit-testing is a dedicated per-pixel lookup (not overlapping
            // DOM elements), so there's no risk of two nearby hit zones
            // "flickering" against each other the way there was with the
            // old SVG version; it can just always be comfortably clickable.
            const radius = currentRadius(id) + 8;
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

            const fromOffset = pushOffsetForNode(fromNode.id, fromNode.x, fromNode.y);
            const toOffset = pushOffsetForNode(toNode.id, toNode.x, toNode.y);

            const tierFrom = depthTiers.get(fromNode.id) ?? 1;
            const tierTo = depthTiers.get(toNode.id) ?? 1;
            const edgeTier = Math.max(tierFrom, tierTo) as 0 | 1 | 2 | 3;
            const isActive =
              hoveredId !== null && (fromNode.id === hoveredId || toNode.id === hoveredId);

            ctx.beginPath();
            ctx.moveTo(fromNode.x + fromOffset.dx, fromNode.y + fromOffset.dy);
            ctx.lineTo(toNode.x + toOffset.dx, toNode.y + toOffset.dy);
            ctx.strokeStyle = isActive
              ? "rgba(107, 114, 128, 1)"
              : `rgba(128, 128, 128, ${DEPTH_TIERS[edgeTier].opacity * 0.4})`;
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();
          }}
        />
      ) : null}
    </div>
  );
}
