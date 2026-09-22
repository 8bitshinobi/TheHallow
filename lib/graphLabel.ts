/**
 * First 1-2 words of a name, used as a node's graph label when no explicit
 * `properties.label` override is set. Shared between the server (lib/objects.ts,
 * building the actual graph) and the client (the "Graph label" field's
 * placeholder in ObjectPropertiesPanel), so the placeholder always shows
 * exactly what the graph would otherwise fall back to.
 */
export function fallbackGraphLabel(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(" ");
}
