// Imports places from the Capacities "Places_All" CSV that aren't already in
// the archive (matched by name, case-insensitive, across all types).
//
// Usage:
//   node --env-file=.env.local scripts/migrate/places-csv.mjs <csv> [--apply]
// Without --apply it only prints what it would do.
//
// Type mapping (from the CSV's `category` column):
//   "Tavern"            -> type "tavern"
//   "Shop, <Category>"  -> type "business", category normalized (no "Shop,"
//                          prefix; the CSV's "Apothocary"/"Jewelry" become
//                          "Apothecary"/"Jeweler")
//   "Town" / "City"     -> type "place", category kept (settlements)
//   blank               -> type "place" (category unknown; nothing guessed)
// Rows whose location text mentions the Iron Crag get location "The Iron Crag"
// (the CSV's original wording is kept as `district`) and a "located in" edge.
import { readFileSync } from "node:fs";
import { getAdminClient, findOrCreateObject, linkObjects } from "./lib.mjs";

const [csvPath, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
if (!csvPath) throw new Error("Usage: places-csv.mjs <csv> [--apply]");

const CATEGORY_FIXES = { apothocary: "Apothecary", apothecary: "Apothecary", jewelry: "Jeweler" };
// Rows that aren't places (a Capacities help/notes object).
const SKIP_TITLES = [/how to use this place notes object/i];

function parseCsv(text) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim());
  const headers = headerLine.split(";").map((h) => h.trim());
  return lines.map((line) => {
    const cells = line.split(";").map((c) => c.trim());
    if (cells.length !== headers.length) {
      throw new Error(`Unexpected column count (${cells.length}) in: ${line}`);
    }
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
  });
}

function classify(row) {
  const category = row.category;
  if (/^tavern$/i.test(category)) return { type: "tavern" };
  const shop = category.match(/^shop,\s*(.+)$/i);
  if (shop) {
    const raw = shop[1].trim();
    return { type: "business", category: CATEGORY_FIXES[raw.toLowerCase()] ?? raw };
  }
  if (/^(town|city)$/i.test(category)) return { type: "place", category };
  return { type: "place" };
}

function buildProperties(row, kind) {
  const props = {};
  if (kind.category) props.category = kind.category;
  if (row.location) {
    if (/iron crag/i.test(row.location)) {
      props.location = "The Iron Crag";
      props.district = row.location;
    } else {
      props.location = row.location;
    }
  }
  if (row.rareExports) props.rare_exports = row.rareExports;
  if (row.mainExport) props.main_export = row.mainExport;
  if (row.magicLevel) props.magic_level = row.magicLevel;
  if (row["description_"]) props.description = row["description_"];
  props.source = "Migrated from Capacities (Places_All.csv)";
  if (row.reference) props.capacities_url = row.reference;
  return props;
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const supabase = getAdminClient();
const { data: existing, error } = await supabase.from("objects").select("name");
if (error) throw new Error(error.message);
const existingNames = new Set((existing ?? []).map((o) => o.name.trim().toLowerCase()));

const plan = [];
for (const row of rows) {
  if (SKIP_TITLES.some((re) => re.test(row.title))) {
    console.log(`- skip (not a place): ${row.title}`);
    continue;
  }
  if (existingNames.has(row.title.trim().toLowerCase())) {
    console.log(`- skip (already in archive): ${row.title}`);
    continue;
  }
  const kind = classify(row);
  plan.push({ row, kind, properties: buildProperties(row, kind) });
}

console.log(`\n${plan.length} object(s) to create${apply ? "" : " (dry run — pass --apply to write)"}:`);
for (const { row, kind, properties } of plan) {
  console.log(
    `  ${kind.type.padEnd(8)} ${row.title}` +
      (properties.category ? `  [${properties.category}]` : "") +
      (properties.location ? `  @ ${properties.location}` : "")
  );
}
if (!apply) process.exit(0);

// Create everything first so location edges can point at any created place.
const ids = new Map();
for (const { row, kind, properties } of plan) {
  ids.set(row.title, await findOrCreateObject(supabase, kind.type, row.title, properties));
}

const { data: crag } = await supabase
  .from("objects")
  .select("id")
  .ilike("name", "The Iron Crag")
  .maybeSingle();
for (const { row, properties } of plan) {
  if (properties.location === "The Iron Crag" && crag && ids.get(row.title) !== crag.id) {
    await linkObjects(supabase, ids.get(row.title), crag.id, "located in");
  }
}
console.log("Done.");
