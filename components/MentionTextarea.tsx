"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { searchObjects } from "@/app/objects/actions";
import { formatMention, hasMention, parseMentions } from "@/lib/mentions";
import { rethrowIfRedirectError } from "@/lib/utils";

type SearchResult = { id: string; type: string; name: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** The object currently being edited, so it doesn't @-mention itself. Omit when creating a brand-new object. */
  excludeId?: string;
};

/**
 * An auto-growing textarea that supports "@" to search for and insert a
 * reference to another object (stored inline as "@[Name](id)" - see
 * lib/mentions.ts). While focused it shows that raw markup so it's editable;
 * once blurred, a mentioned value renders as plain text with a real link in
 * place of the markup.
 */
export function MentionTextarea({ value, onChange, placeholder, excludeId }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(!hasMention(value));
  const [query, setQuery] = useState<string | null>(null);
  const [queryStart, setQueryStart] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isEditing) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, isEditing]);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    searchObjects(query, excludeId)
      .then((found) => {
        if (!cancelled) {
          setResults(found);
          setActiveIndex(0);
        }
      })
      .catch((err) => rethrowIfRedirectError(err));
    return () => {
      cancelled = true;
    };
  }, [query, excludeId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const uptoCursor = text.slice(0, cursor);
    const atIndex = uptoCursor.lastIndexOf("@");
    if (atIndex === -1) {
      setQuery(null);
      return;
    }
    const between = uptoCursor.slice(atIndex + 1);
    if (/[\s\]\)]/.test(between)) {
      setQuery(null);
      return;
    }
    setQueryStart(atIndex);
    setQuery(between);
  }

  function insertMention(result: SearchResult) {
    const el = ref.current;
    const cursor = el ? el.selectionStart : value.length;
    const before = value.slice(0, queryStart);
    const after = value.slice(cursor);
    const inserted = `${formatMention(result.name, result.id)} `;
    onChange(`${before}${inserted}${after}`);
    setQuery(null);
    requestAnimationFrame(() => {
      if (el) {
        const pos = before.length + inserted.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!query || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(results[activeIndex]);
    } else if (e.key === "Escape") {
      setQuery(null);
    }
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => {
          setIsEditing(true);
          requestAnimationFrame(() => ref.current?.focus());
        }}
        className="min-h-9 flex-1 cursor-text rounded border border-transparent px-2 py-1.5 text-sm leading-normal whitespace-pre-wrap hover:border-black/15 dark:hover:border-white/15"
      >
        {parseMentions(value).map((seg, i) =>
          seg.type === "mention" ? (
            <Link
              key={i}
              href={`/objects/${seg.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 underline hover:no-underline dark:text-blue-400"
            >
              {seg.name}
            </Link>
          ) : (
            <span key={i}>{seg.value}</span>
          )
        )}
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay so a click on a dropdown result registers before it closes.
          setTimeout(() => {
            setQuery(null);
            if (hasMention(value)) setIsEditing(false);
          }, 150);
        }}
        placeholder={placeholder}
        rows={1}
        className="min-h-9 w-full resize-none overflow-hidden rounded border border-black/15 px-2 py-1.5 text-sm leading-normal whitespace-pre-wrap dark:border-white/15 dark:bg-transparent"
      />
      {query !== null && results.length > 0 ? (
        <ul className="absolute z-10 mt-1 w-full max-w-xs rounded border border-black/15 bg-white shadow-lg dark:border-white/15 dark:bg-black">
          {results.map((result, i) => (
            <li key={result.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertMention(result)}
                className={`block w-full px-2 py-1.5 text-left text-sm ${
                  i === activeIndex ? "bg-black/5 dark:bg-white/10" : ""
                }`}
              >
                <span className="text-black/50 dark:text-white/50">{result.type}</span>{" "}
                {result.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
