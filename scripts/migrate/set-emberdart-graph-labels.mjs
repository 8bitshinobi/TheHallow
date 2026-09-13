import { getAdminClient } from "./lib.mjs";

const supabase = getAdminClient();

// Short (1-2 word) graph-view labels for objects whose full name is too
// long to read under a small node. NPCs (e.g. "Rangard Ricker") are
// already short enough and don't need an override.
const LABELS = {
  "Triumvirate of Understanding": "Triumvirate",
  "Origin Lore: The Emberdart's First Flame": "Origin Lore",
  "Field Journal: Rangard Ricker – Emberdart Observation": "Rangard's Journal",
  "Field Journal: Succa Dogwood – Botanical Observations": "Succa's Journal",
  "Succa Dogwood's Field Rebuttal": "Succa's Rebuttal",
  "Weatherbee's Menagerie Notes: Exhibit 7A – Sylas igniculus": "Weatherbee's Notes",
};

for (const [name, label] of Object.entries(LABELS)) {
  const { data: object, error: findError } = await supabase
    .from("objects")
    .select("id, properties")
    .eq("name", name)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!object) {
    console.log(`! not found: "${name}"`);
    continue;
  }

  const { error } = await supabase
    .from("objects")
    .update({ properties: { ...object.properties, label } })
    .eq("id", object.id);

  if (error) throw new Error(error.message);
  console.log(`+ "${name}" -> label "${label}"`);
}
