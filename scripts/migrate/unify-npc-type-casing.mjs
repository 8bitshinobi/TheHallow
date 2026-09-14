// One-off fix: an object was created with type "npc" before the type field
// was a dropdown, alongside existing "NPC" objects. Normalizes any
// case-variant of "npc" to the canonical "NPC".
import { getAdminClient } from "./lib.mjs";

const CANONICAL = "NPC";

const supabase = getAdminClient();

const { data, error } = await supabase.from("objects").select("id, type, name");
if (error) throw new Error(error.message);

const mismatched = (data ?? []).filter(
  (row) => row.type.toLowerCase() === CANONICAL.toLowerCase() && row.type !== CANONICAL
);

if (mismatched.length === 0) {
  console.log("No mismatched NPC-type objects found.");
  process.exit(0);
}

for (const row of mismatched) {
  const { error: updateError } = await supabase
    .from("objects")
    .update({ type: CANONICAL })
    .eq("id", row.id);
  if (updateError) throw new Error(updateError.message);
  console.log(`~ "${row.name}" (${row.id}): "${row.type}" -> "${CANONICAL}"`);
}

console.log(`Done. Updated ${mismatched.length} object(s).`);
