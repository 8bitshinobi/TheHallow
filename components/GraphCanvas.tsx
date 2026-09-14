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

  // Force setup — link distance/charge/collide tuned to the same "tight
  // clusters, disconnected components kept in the same neighborhood"
  // character established earlier, just running as a live simulation
  // instead of a one-shot 300-tick layout. Deliberately static (resting
  // radius only, no hover dependence, no reheating on hover): an earlier
  // version made a hovered node's growth dynamically resize the collide
  // force and reheated on every hover change so neighbors would get
  // physically shoved aside — but with only a weak x/y centering force,
  // that reheat let the *whole* graph's position drift a little further
  // on every hover, compounding over time into visible instability. Hover
  // now only changes what's drawn (see nodeCanvasObject/currentRadius),
  // never the physics, which is what actually stopped it from settling.
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
    fg.d3ReheatSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData]);

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
          nodeLabel={() => ""}
          onNodeHover={(node) => setHoveredId((node as FGNode | null)?.id ?? null)}
          onNodeClick={(node) => router.push(hrefFor((node as FGNode).id))}
          nodeCanvasObject={(node, ctx) => {
            const id = (node as FGNode).id;
            const x = node.x ?? 0;
            const y = node.y ?? 0;
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
            const x = node.x ?? 0;
            const y = node.y ?? 0;
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
          linkColor={(link) => {
            const from = typeof link.source === "object" ? (link.source as FGNode).id : link.source;
            const to = typeof link.target === "object" ? (link.target as FGNode).id : link.target;
            const isActive = hoveredId !== null && (from === hoveredId || to === hoveredId);
            const tierFrom = depthTiers.get(from as string) ?? 1;
            const tierTo = depthTiers.get(to as string) ?? 1;
            const edgeTier = Math.max(tierFrom, tierTo) as 0 | 1 | 2 | 3;
            if (isActive) return "rgba(107, 114, 128, 1)";
            return `rgba(128, 128, 128, ${DEPTH_TIERS[edgeTier].opacity * 0.4})`;
          }}
          linkWidth={(link) => {
            const from = typeof link.source === "object" ? (link.source as FGNode).id : link.source;
            const to = typeof link.target === "object" ? (link.target as FGNode).id : link.target;
            return hoveredId !== null && (from === hoveredId || to === hoveredId) ? 2 : 1;
          }}
        />
      ) : null}
    </div>
  );
}
