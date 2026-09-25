/**
 * Minimal RTF export for a compilation's placed entries. Follows the skeleton
 * Scott specified: one font (Times New Roman), a bold/large heading per
 * entry from its title, its narrative_text as body paragraphs, and a page
 * break between entries.
 */

export type CompilationRtfEntry = { title: string; narrativeText: string };

/** Escapes RTF control characters and non-ASCII text (RTF's \ansi charset needs \uNNNN for anything above 127). */
function escapeRtf(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (char === "\\" || char === "{" || char === "}") {
      out += `\\${char}`;
    } else if (code > 126) {
      // \uN is followed by a fallback char for readers that can't do Unicode; "?" is the RTF-standard placeholder.
      out += `\\u${code}?`;
    } else {
      out += char;
    }
  }
  return out;
}

/** Converts narrative_text's newlines into RTF paragraph breaks, escaping everything else. */
function bodyParagraphs(narrativeText: string): string {
  return narrativeText
    .split(/\r\n|\r|\n/)
    .map((line) => escapeRtf(line))
    .join("\\par\n");
}

export function buildCompilationRtf(entries: CompilationRtfEntry[]): string {
  const parts = entries.map((entry, index) => {
    const heading = `{\\b\\fs32 ${escapeRtf(entry.title)}\\par}`;
    const body = entry.narrativeText.trim() ? `\\par\n${bodyParagraphs(entry.narrativeText)}` : "";
    const pageBreak = index < entries.length - 1 ? "\n\\page\n" : "";
    return `${heading}\n${body}${pageBreak}`;
  });

  return `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n\\f0\\fs24\n${parts.join("\n")}\n}`;
}
