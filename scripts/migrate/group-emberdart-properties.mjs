import { getAdminClient } from "./lib.mjs";

const supabase = getAdminClient();

// Maps existing flat property keys to grouped keys (dot-prefix convention),
// now that the properties editor supports collapsible groups.
const RENAME = {
  scientific_name: "taxonomy.scientific_name",
  common_names: "taxonomy.common_names",
  codex: "taxonomy.codex",
  kingdom: "taxonomy.kingdom",
  sphere: "taxonomy.sphere",
  phylum: "taxonomy.phylum",
  order: "taxonomy.order",
  family: "taxonomy.family",
  genus: "taxonomy.genus",
  species: "taxonomy.species",
  lore_tier: "taxonomy.lore_tier",

  size: "vitals.size",
  trainability: "vitals.trainability",
  communication: "vitals.communication",
  lifespan: "vitals.lifespan",
  disposition: "vitals.disposition",
  habitat: "vitals.habitat",

  cr: "mechanics.cr",
  stat_block: "mechanics.stat_block",
  abilities: "mechanics.abilities",
  harvestables: "mechanics.harvestables",
  knowledge_table: "mechanics.knowledge_table",
  encounter_role: "mechanics.encounter_role",

  description: "narrative.description",
  field_guide_summary: "narrative.field_guide_summary",
  ecology_notes: "narrative.ecology_notes",
  notable_quotes: "narrative.notable_quotes",
};

const { data: object, error: findError } = await supabase
  .from("objects")
  .select("id, properties")
  .eq("type", "creature")
  .eq("name", "Emberdart")
  .single();

if (findError) throw new Error(findError.message);

const regrouped = Object.fromEntries(
  Object.entries(object.properties).map(([key, value]) => [RENAME[key] ?? key, value])
);

const { error } = await supabase
  .from("objects")
  .update({ properties: regrouped })
  .eq("id", object.id);

if (error) throw new Error(error.message);

console.log("Regrouped Emberdart properties:", Object.keys(regrouped));
