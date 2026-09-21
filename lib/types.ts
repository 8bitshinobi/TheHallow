export type HallowObject = {
  id: string;
  type: string;
  name: string;
  properties: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type Edge = {
  id: string;
  from_id: string;
  to_id: string;
  label: string | null;
  created_at: string;
};

export type ConnectedObject = {
  edgeId: string;
  label: string | null;
  object: { id: string; type: string; name: string; graphLabel?: string; icon?: string };
};

// graphLabel is an optional short (1-2 word) display name for the graph
// view, sourced from the object's own properties.label — full names like
// "Field Journal: Rangard Ricker – Emberdart Observation" are too long to
// show under a small node. Falls back to the full name (truncated) when
// no explicit label has been set.
export type GraphNode = { id: string; type: string; name: string; graphLabel?: string; icon?: string };
export type GraphEdge = { id: string; from: string; to: string; label: string | null };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };
