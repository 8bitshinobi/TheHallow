"use client";

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { GraphEdge, GraphNode } from "@/lib/types";

type PositionedNode = GraphNode & SimulationNodeDatum;
type SimLink = SimulationLinkDatum<PositionedNode>;

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  centerId?: string;
  // "recenter": clicking a neighbor navigates to *its* graph view (the
  // center node instead links to its own detail page). "detail": every
  // node links straight to its detail page. Serializable props only —
  // this component is rendered from a Server Component, so a function
  // prop like a getHref callback can't cross that boundary.
  linkMode: "recenter" | "detail";
};

// Hover/neighbor name labels are visually noisy right now (long titles
// overlap heavily) — off for now, flip back on once that's addressed.
const SHOW_LABELS = false;

// Depth tiers by graph distance from the hovered node: 0 = the hovered node
// itself, 1 = its direct connections, 2 = two hops out, 3 = everything else.
// z is a "distance from camera" value (negative = closer); opacity per tier
// is an explicit design choice, not a monotonic falloff (tier 3 is
// deliberately less transparent than tier 2 so the unrelated background
// doesn't wash out completely).
const DEPTH_TIERS: Record<0 | 1 | 2 | 3, { z: number; opacity: number }> = {
  0: { z: -100, opacity: 1 },
  1: { z: 0, opacity: 0.75 },
  2: { z: 25, opacity: 0.5 },
  3: { z: 50, opacity: 0.75 },
};

// Simple perspective projection (scale = cameraDistance / (cameraDistance +
// z)), so "closer" (negative z) reads as bigger and "further" (positive z)
// as smaller — chosen so z=-100 lands close to the ~2.4x the old hardcoded
// hover scale used.
const CAMERA_DISTANCE = 170;

function scaleForZ(z: number): number {
  return CAMERA_DISTANCE / (CAMERA_DISTANCE + z);
}

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

// Deterministic RNG seeded from a node id, so each node gets a stable
// (not re-randomized every render) drift pattern.
function mulberry32(seed: number) {
  return function random() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type DriftParams = {
  ampX: number;
  ampY: number;
  freqX: number;
  freqY: number;
  phaseX: number;
  phaseY: number;
};

function driftParamsFor(id: string): DriftParams {
  const random = mulberry32(hashString(id));
  return {
    ampX: 3 + random() * 3, // px
    ampY: 3 + random() * 3,
    freqX: 0.15 + random() * 0.15, // slow — a full cycle every ~20-40s
    freqY: 0.15 + random() * 0.15,
    phaseX: random() * Math.PI * 2,
    phaseY: random() * Math.PI * 2,
  };
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

/** Subtle per-node drift (Lissajous-style, from a couple of desynced sine waves) applied on top of the settled force-layout position, so idle nodes feel alive rather than frozen. */
function useDriftClock(enabled: boolean) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, [enabled]);

  return tick / 10; // seconds elapsed, at 10 updates/sec
}

export function GraphCanvas({ nodes, edges, centerId, linkMode }: Props) {
  function hrefFor(id: string): string {
    if (linkMode === "detail" || id === centerId) return `/objects/${id}`;
    return `/objects/${id}/graph`;
  }

  const reduceMotion = useReducedMotion();
  const t = useDriftClock(!reduceMotion);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Settled layout — computed once per graph, not per animation frame.
  const anchored = useMemo<PositionedNode[]>(() => {
    if (nodes.length === 0) return [];

    const simNodes: PositionedNode[] = nodes.map((node) => ({ ...node }));
    const simLinks: SimLink[] = edges.map((edge) => ({ source: edge.from, target: edge.to }));

    const simulation = forceSimulation(simNodes)
      .force(
        "link",
        forceLink<PositionedNode, SimLink>(simLinks)
          .id((node) => node.id)
          .distance(110)
          .strength(0.6)
      )
      .force("charge", forceManyBody().strength(-260))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(46))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    return simNodes;
  }, [nodes, edges]);

  if (anchored.length <= 1) {
    return <p className="text-sm text-black/50 dark:text-white/50">No connections yet.</p>;
  }

  const neighborIds = new Set<string>();
  if (hoveredId) {
    for (const edge of edges) {
      if (edge.from === hoveredId) neighborIds.add(edge.to);
      if (edge.to === hoveredId) neighborIds.add(edge.from);
    }
  }

  // Live positions = anchor + drift. Edges read from this too, so lines
  // stay attached to their nodes as they float instead of drifting apart.
  // The hovered node itself skips drift, so its label doesn't jitter while
  // you're trying to read it.
  const rendered = anchored.map((node) => {
    if (reduceMotion || node.id === hoveredId) return node;
    const drift = driftParamsFor(node.id);
    return {
      ...node,
      x: (node.x ?? 0) + drift.ampX * Math.sin(t * drift.freqX + drift.phaseX),
      y: (node.y ?? 0) + drift.ampY * Math.sin(t * drift.freqY + drift.phaseY),
    };
  });

  // Bounding box from the settled (non-drifting) layout, padded well beyond
  // the small drift amplitude, so the viewBox itself stays still.
  const xs = anchored.map((node) => node.x ?? 0);
  const ys = anchored.map((node) => node.y ?? 0);
  const padding = 60;
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const width = Math.max(...xs) - minX + padding;
  const height = Math.max(...ys) - minY + padding;

  const byId = new Map(rendered.map((node) => [node.id, node]));
  const anchoredById = new Map(anchored.map((node) => [node.id, node]));
  const depthTiers = computeDepthTiers(
    hoveredId,
    nodes.map((node) => node.id),
    edges
  );

  return (
    <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="h-[500px] w-full">
      {edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        const midX = ((from.x ?? 0) + (to.x ?? 0)) / 2;
        const midY = ((from.y ?? 0) + (to.y ?? 0)) / 2;
        const isActive = hoveredId !== null && (edge.from === hoveredId || edge.to === hoveredId);
        const isDimmed = hoveredId !== null && !isActive;

        return (
          <g key={edge.id} style={{ transition: "opacity 150ms ease-out" }}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              strokeOpacity={isActive ? 0.6 : 0.25}
              strokeWidth={isActive ? 2 : 1.5}
              opacity={isDimmed ? 0.25 : 1}
              className="text-black dark:text-white"
            />
            {edge.label && isActive ? (
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                fontSize={10}
                className="fill-black/50 dark:fill-white/50"
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Fixed, hover-independent order — reordering elements to "bring to
          front" caused inconsistent transitions (some nodes' in-flight
          scale animation would glitch on reorder). Depth is conveyed by
          scale/opacity alone instead; that's enough since nodes rarely
          overlap in this layout. */}
      {rendered.map((node) => {
        const isCenter = node.id === centerId;
        const isHovered = node.id === hoveredId;
        const isNeighbor = neighborIds.has(node.id);
        const showLabel = SHOW_LABELS && (isHovered || isNeighbor);
        const radius = isCenter ? 10 : 6;
        const hitRadius = radius + 14;

        const tier = depthTiers.get(node.id) ?? 1;
        const { z, opacity } = DEPTH_TIERS[tier];
        const scale = scaleForZ(z);

        // Pivot on the settled (non-drifting) position, not the live
        // drifting one — transform-origin isn't itself a transitioned
        // property, so if it moved every drift tick it would snap the
        // scale's visual center mid-animation instead of easing smoothly.
        const anchor = anchoredById.get(node.id);
        const originX = anchor?.x ?? node.x;
        const originY = anchor?.y ?? node.y;

        return (
          <Link
            key={node.id}
            href={hrefFor(node.id)}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: `${originX}px ${originY}px`,
              transition: "transform 500ms ease-out, opacity 500ms ease-out",
              opacity,
            }}
          >
              {/* Invisible, larger than the visible dot, so a small node is
                  still easy to hover/click. fill="transparent" (not "none")
                  so it still registers pointer events. */}
              <circle cx={node.x} cy={node.y} r={hitRadius} fill="transparent" />
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={colorForType(node.type)}
                stroke={isCenter ? "currentColor" : "none"}
                strokeWidth={isCenter ? 2 : 0}
                className={isCenter ? "text-black dark:text-white" : undefined}
              />
              {showLabel ? (
                <>
                  {/* Only the hovered node itself is CSS-scaled (transform: scale
                      above), so its label font is set small here and grows with
                      it. Neighbor labels aren't scaled, so theirs stays at normal
                      readable size directly. */}
                  <text
                    x={node.x}
                    y={(node.y ?? 0) + radius + 12}
                    textAnchor="middle"
                    fontSize={isHovered ? 6 : 11}
                    className="fill-black dark:fill-white"
                  >
                    {node.name}
                  </text>
                  {isHovered ? (
                    <text
                      x={node.x}
                      y={(node.y ?? 0) + radius + 21}
                      textAnchor="middle"
                      fontSize={5}
                      className="fill-black/50 dark:fill-white/50"
                    >
                      {node.type}
                    </text>
                  ) : null}
                </>
              ) : null}
            </Link>
          );
        })}
    </svg>
  );
}
