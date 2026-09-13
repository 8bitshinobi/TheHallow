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

  // Live positions = anchor + drift. Edges read from this too, so lines
  // stay attached to their nodes as they float instead of drifting apart.
  const rendered = anchored.map((node) => {
    if (reduceMotion) return node;
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

  return (
    <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="h-[500px] w-full">
      {edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        const midX = ((from.x ?? 0) + (to.x ?? 0)) / 2;
        const midY = ((from.y ?? 0) + (to.y ?? 0)) / 2;

        return (
          <g key={edge.id}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              strokeOpacity={0.25}
              strokeWidth={1.5}
              className="text-black dark:text-white"
            />
            {edge.label ? (
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

      {rendered.map((node) => {
        const isCenter = node.id === centerId;
        const radius = isCenter ? 22 : 16;

        return (
          <Link key={node.id} href={hrefFor(node.id)}>
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              fill={colorForType(node.type)}
              stroke={isCenter ? "currentColor" : "none"}
              strokeWidth={isCenter ? 3 : 0}
              className={isCenter ? "text-black dark:text-white" : undefined}
            />
            <text
              x={node.x}
              y={(node.y ?? 0) + radius + 14}
              textAnchor="middle"
              fontSize={11}
              className="fill-black dark:fill-white"
            >
              {node.name}
            </text>
            <text
              x={node.x}
              y={(node.y ?? 0) + radius + 26}
              textAnchor="middle"
              fontSize={9}
              className="fill-black/50 dark:fill-white/50"
            >
              {node.type}
            </text>
          </Link>
        );
      })}
    </svg>
  );
}
