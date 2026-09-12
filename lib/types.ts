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
  object: Pick<HallowObject, "id" | "type" | "name">;
};
