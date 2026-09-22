import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared GET/POST handlers for the archive's generator-backed object types
 * (taverns, businesses). Two separate ideas of "available":
 *
 * - The anonymous public API (this file's GET) is OPT-IN. It uses the anon
 *   key with no session. The database (migration 0003) only lets anon see
 *   these types when properties.visibility = 'public'; the filters here
 *   repeat that so the intent is visible in code, and only the whitelisted
 *   fields are ever returned.
 * - The in-app generators are default-INCLUDE: they read through the logged-in
 *   session (lib/generatorPool.ts) and use everything except objects marked
 *   visibility = 'private'.
 *
 * POST requires the logged-in session (same RLS as the rest of the app) and
 * saves status=in_development. It sets no visibility: an unset object is in
 * the in-app pool but is NOT public. There is no anon write path.
 */
export type ObjectRouteConfig = {
  /** objects.type this route serves. */
  type: string;
  /** Plain-text properties returned by GET. */
  textFields: readonly string[];
  /** List properties (one item per line): [field, olderSingleValueName?] returned as arrays. */
  listFields: readonly (readonly [string, string?])[];
  /** Properties POST accepts (a superset of what GET returns can include GM-only fields). */
  writeFields: readonly string[];
  /** Query params GET can filter on (each matches properties->>param exactly). */
  filters: readonly string[];
  /** Stored in the `source` property on saved objects. */
  source: string;
  /** Key the GET response nests results under, e.g. "taverns" -> { taverns: [...] }. */
  responseKey: string;
};

const MAX_LENGTH = 4000;

// Property values may hold "@[Name](uuid)" mentions; expose just the name.
export function plain(value: string): string {
  return value.replace(/@\[([^\]]*)\]\([0-9a-fA-F-]{36}\)/g, "$1");
}

/** Turns a stored row into the flat item shape used by the API and the in-app pool. */
export function mapRow(
  config: Pick<ObjectRouteConfig, "textFields" | "listFields">,
  row: { id: string; name: string; properties: unknown },
  options: { stripMentions?: boolean; extraTextFields?: readonly string[] } = {}
): Record<string, string | string[]> {
  const { stripMentions = true, extraTextFields = [] } = options;
  const clean = (value: string) => (stripMentions ? plain(value) : value);
  const props = (row.properties ?? {}) as Record<string, string>;
  const out: Record<string, string | string[]> = { id: row.id, name: row.name };
  for (const field of [...config.textFields, ...extraTextFields]) {
    out[field] = clean(props[field] ?? "");
  }
  for (const [field, legacyField] of config.listFields) {
    out[field] = clean(props[field] ?? (legacyField ? props[legacyField] : "") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return out;
}

export function createObjectHandlers(config: ObjectRouteConfig) {
  async function GET(request: Request) {
    const supabase = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    let query = supabase
      .from("objects")
      .select("id, name, properties")
      .eq("type", config.type)
      .eq("properties->>visibility", "public")
      .order("name");

    const params = new URL(request.url).searchParams;
    for (const filter of config.filters) {
      const value = params.get(filter);
      if (value) query = query.eq(`properties->>${filter}`, value);
    }

    const { data, error } = await query;
    if (error) {
      return Response.json({ error: "Could not load results" }, { status: 500 });
    }

    const items = (data ?? []).map((row) => mapRow(config, row));

    // Data changes rarely, so let browsers/CDN reuse it briefly. Un-publishing
    // can take up to ~1 minute (plus the stale window) to disappear.
    return Response.json(
      { [config.responseKey]: items },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }

  async function POST(request: Request) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Body must be JSON" }, { status: 400 });
    }
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Body must be an object" }, { status: 400 });
    }
    const input = body as Record<string, unknown>;

    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 200) {
      return Response.json({ error: "name is required (max 200 chars)" }, { status: 400 });
    }

    const properties: Record<string, string> = {};
    for (const field of config.writeFields) {
      const value = input[field];
      if (value === undefined || value === null || value === "") continue;
      if (typeof value !== "string" || value.length > MAX_LENGTH) {
        return Response.json(
          { error: `${field} must be a string (max ${MAX_LENGTH} chars)` },
          { status: 400 }
        );
      }
      properties[field] = value;
    }

    // Set server-side, never taken from the client. No visibility is set, so a
    // saved object is available to the in-app generators but is not public
    // (the public API is opt-in via visibility=public).
    properties.status = "in_development";
    properties.source = config.source;

    const { data: created, error } = await supabase
      .from("objects")
      .insert({ type: config.type, name, properties })
      .select("id")
      .single();
    if (error || !created) {
      return Response.json({ error: "Could not save" }, { status: 500 });
    }

    // Optionally link to the location (the archive's "located in" connection).
    const locationId = input.location_id;
    let linked = false;
    if (typeof locationId === "string" && locationId) {
      const { data: location } = await supabase
        .from("objects")
        .select("id")
        .eq("id", locationId)
        .in("type", ["region", "place"])
        .maybeSingle();
      if (location) {
        const { error: edgeError } = await supabase
          .from("edges")
          .insert({ from_id: created.id, to_id: location.id, label: "located in" });
        linked = !edgeError;
      }
    }

    return Response.json({ id: created.id, linked }, { status: 201 });
  }

  return { GET, POST };
}
