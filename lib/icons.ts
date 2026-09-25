/**
 * Object icons. The icon shown for an object is resolved at display time, in
 * this order, and the automatic ones are never written to the database:
 *   1. properties.icon  (manual override, set on the object's page)
 *   2. CATEGORY_ICONS[properties.category]  (e.g. a business's category)
 *   3. TYPE_ICONS[type]  (case-insensitive)
 *   4. FALLBACK_ICON
 */

import { CATEGORIES } from "@/lib/businesses/tables";

export const TYPE_ICONS: Record<string, string> = {
  tavern: "🍺",
  business: "🏪",
  region: "🗺️",
  place: "📍",
  lore: "📜",
  npc: "👤",
  pcs: "🎭",
  organization: "🏛️",
  creature: "🐾",
  adventure_hook: "🧭",
  idea_seed: "🌱",
  field_journal: "📓",
  production_notes: "📝",
  curator_notes: "🗂️",
  campaign_arc: "📖",
  events: "🗓️",
  ancestries: "🧬",
  cultures: "🏺",
  arc: "🧵",
  plot_beat: "🎬",
  compilation: "📚",
};

/** Keyed by lowercase category: every business category, plus settlement sizes. */
export const CATEGORY_ICONS: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((category) => [category.name.toLowerCase(), category.icon])),
  town: "🏘️",
  city: "🏙️",
};

export const FALLBACK_ICON = "◆";

export function iconFor(type: string, properties?: Record<string, string> | null): string {
  const manual = properties?.icon?.trim();
  if (manual) return manual;

  const category = properties?.category?.trim().toLowerCase();
  if (category && CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];

  return TYPE_ICONS[type.trim().toLowerCase()] ?? FALLBACK_ICON;
}
