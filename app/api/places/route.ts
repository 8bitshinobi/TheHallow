import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Public GET: anon key, no session. The database (see migration 0002) only
// lets anon see type='tavern' rows with properties.visibility='public'; the
// filters below repeat that so the intent is visible in code too.
//
// Only the whitelisted fields below are returned, so any other property on a
// tavern object (e.g. GM notes added later) never leaves the database via
// this endpoint.
const TEXT_FIELDS = [
  "description",
  "innkeeper",
  "innkeeper_quirk",
  "signature",
  "signature_kind",
  "location",
] as const;

// List fields are stored as one string, one item per line, and returned as
// arrays. The second key is the older single-value property name, so
// taverns saved before lists existed still read correctly.
const LIST_FIELDS = [
  ["drinks", "drink"],
  ["food", "food"],
  ["patrons", "patrons"],
  ["rumors", "rumor"],
] as const;

// Property values may hold "@[Name](uuid)" mentions; expose just the name.
function plain(value: string): string {
  return value.replace(/@\[([^\]]*)\]\([0-9a-fA-F-]{36}\)/g, "$1");
}

export async function GET(request: Request) {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  let query = supabase
    .from("objects")
    .select("id, name, properties")
    .eq("type", "tavern")
    .eq("properties->>visibility", "public")
    .order("name");

  const location = new URL(request.url).searchParams.get("location");
  if (location) query = query.eq("properties->>location", location);

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: "Could not load places" }, { status: 500 });
  }

  const taverns = (data ?? []).map((row) => {
    const props = (row.properties ?? {}) as Record<string, string>;
    const out: Record<string, string | string[]> = { id: row.id, name: row.name };
    for (const field of TEXT_FIELDS) {
      out[field] = plain(props[field] ?? "");
    }
    for (const [field, legacyField] of LIST_FIELDS) {
      out[field] = plain(props[field] ?? props[legacyField] ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return out;
  });

  // Data changes rarely, so let browsers/CDN reuse it briefly. Un-publishing a
  // tavern can take up to ~1 minute (plus the stale window) to disappear.
  return Response.json(
    { taverns },
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}

const MAX_LENGTH = 4000;
// List fields (drinks, food, patrons, rumors) arrive as one string with one
// item per line.
const WRITE_FIELDS = [
  "description",
  "innkeeper",
  "innkeeper_quirk",
  "signature",
  "signature_kind",
  "drinks",
  "food",
  "patrons",
  "rumors",
  "location",
  "patron_crowd",
] as const;

// Authenticated write: uses the logged-in user's session (cookies), so RLS
// treats the request as `authenticated`. There is no anon write path — the
// anon role has no insert policy — and an unauthenticated call gets 401 here.
export async function POST(request: Request) {
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
  for (const field of WRITE_FIELDS) {
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

  // Set server-side, never taken from the client: a saved tavern always starts
  // private, so nothing goes public by accident.
  properties.visibility = "private";
  properties.status = "in_development";
  properties.source = "Tavern generator";

  const { data: created, error } = await supabase
    .from("objects")
    .insert({ type: "tavern", name, properties })
    .select("id")
    .single();
  if (error || !created) {
    return Response.json({ error: "Could not save tavern" }, { status: 500 });
  }

  // Optionally link to the region (the archive's "located in" connection).
  const locationId = input.location_id;
  let linked = false;
  if (typeof locationId === "string" && locationId) {
    const { data: region } = await supabase
      .from("objects")
      .select("id")
      .eq("id", locationId)
      .eq("type", "region")
      .maybeSingle();
    if (region) {
      const { error: edgeError } = await supabase
        .from("edges")
        .insert({ from_id: created.id, to_id: region.id, label: "located in" });
      linked = !edgeError;
    }
  }

  return Response.json({ id: created.id, linked }, { status: 201 });
}
