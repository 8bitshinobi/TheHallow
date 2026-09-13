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
import { useMemo } from "react";
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

function colorForType(type: string): string {
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = (hash * 31 + type.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function GraphCanvas({ nodes, edges, centerId, linkMode }: Props) {
  function hrefFor(id: string): string {
    if (linkMode === "detail" || id === centerId) return `/objects/${id}`;
    return `/objects/${id}/graph`;
  }


  // Pure derived layout from props — a synchronous CPU computation, not a
  // side effect — so this belongs in useMemo, not useEffect+setState.
  const positioned = useMemo<PositionedNode[]>(() => {
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

  if (positioned.length <= 1) {
    return <p className="text-sm text-black/50 dark:text-white/50">No connections yet.</p>;
  }

  const xs = positioned.map((node) => node.x ?? 0);
  const ys = positioned.map((node) => node.y ?? 0);
  const padding = 60;
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const width = Math.max(...xs) - minX + padding;
  const height = Math.max(...ys) - minY + padding;

  const byId = new Map(positioned.map((node) => [node.id, node]));

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

      {positioned.map((node) => {
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
