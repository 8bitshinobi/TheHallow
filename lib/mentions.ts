/**
 * Property values can embed a reference to another object as
 * "@[Name](uuid)" (inserted by MentionTextarea's @-autocomplete). These
 * helpers parse that inline syntax for rendering and edge-syncing.
 */

// A "g"-flagged RegExp mutates its own .lastIndex as it matches, so a single
// shared instance corrupts later searches (e.g. hasMention leaves lastIndex
// non-zero, which matchAll/exec then inherit, silently skipping the first
// match). Each function below builds its own instance instead of sharing one.
function mentionPattern(): RegExp {
  return /@\[([^\]]*)\]\(([0-9a-fA-F-]{36})\)/g;
}

export function formatMention(name: string, id: string): string {
  return `@[${name}](${id})`;
}

export function hasMention(text: string): boolean {
  return mentionPattern().test(text);
}

export function extractMentionIds(properties: Record<string, string>): string[] {
  const ids = new Set<string>();
  for (const value of Object.values(properties)) {
    for (const match of value.matchAll(mentionPattern())) {
      ids.add(match[2]);
    }
  }
  return Array.from(ids);
}

export type MentionSegment =
  | { type: "text"; value: string }
  | { type: "mention"; name: string; id: string };

export function parseMentions(text: string): MentionSegment[] {
  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  const regex = mentionPattern();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "mention", name: match[1], id: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}
