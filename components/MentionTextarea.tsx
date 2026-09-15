"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createObject, listTypes, searchObjects } from "@/app/objects/actions";
import { formatMention, hasMention, parseMentions } from "@/lib/mentions";
import { rethrowIfRedirectError } from "@/lib/utils";

type SearchResult = { id: string; type: string; name: string };

const NEW_TYPE_VALUE = "__new__";

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
 * lib/mentions.ts), with an option to create the object on the spot if
 * nothing matches. While focused it shows that raw markup so it's editable;
 * once blurred, a mentioned value renders as plain text with a real link in
 * place of the markup.
 */
export function MentionTextarea({ value, onChange, placeholder, excludeId }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(!hasMention(value));
  const [query, setQuery] = useState<string | null>(null);
  const [queryStart, setQueryStart] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [isCreating, setIsCreating] = useState(false);
  const [types, setTypes] = useState<string[] | null>(null);
  const [newType, setNewType] = useState("");
  const [isNewTypeEntry, setIsNewTypeEntry] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  function closeDropdown() {
    setQuery(null);
    setIsCreating(false);
    setCreateError(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const uptoCursor = text.slice(0, cursor);
    const atIndex = uptoCursor.lastIndexOf("@");
    if (atIndex === -1) {
      closeDropdown();
      return;
    }
    const between = uptoCursor.slice(atIndex + 1);
    if (/[\s\]\)]/.test(between)) {
      closeDropdown();
      return;
    }
    setQueryStart(atIndex);
    setQuery(between);
  }

  function insertMention(target: SearchResult) {
    const el = ref.current;
    const cursor = el ? el.selectionStart : value.length;
    const before = value.slice(0, queryStart);
    const after = value.slice(cursor);
    const inserted = `${formatMention(target.name, target.id)} `;
    onChange(`${before}${inserted}${after}`);
    closeDropdown();
    requestAnimationFrame(() => {
      if (el) {
        const pos = before.length + inserted.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  }

  async function startCreating() {
    setIsCreating(true);
    setCreateError(null);
    if (types === null) {
      try {
        const found = await listTypes();
        setTypes(found);
        setNewType(found[0] ?? "");
        setIsNewTypeEntry(found.length === 0);
      } catch (err) {
        rethrowIfRedirectError(err);
        setCreateError(err instanceof Error ? err.message : "Failed to load types.");
      }
    }
  }

  async function handleCreate() {
    const name = (query ?? "").trim();
    if (!name || !newType.trim()) return;

    setIsSubmittingCreate(true);
    setCreateError(null);
    try {
      const { id } = await createObject(newType.trim(), name, {});
      insertMention({ id, type: newType.trim(), name });
      router.refresh();
    } catch (err) {
      rethrowIfRedirectError(err);
      setCreateError(err instanceof Error ? err.message : "Failed to create object.");
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  const itemCount = results.length + (query?.trim() ? 1 : 0);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!query || isCreating || itemCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % itemCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + itemCount) % itemCount);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (activeIndex < results.length) {
        insertMention(results[activeIndex]);
      } else {
        startCreating();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
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
          // Delay so a click inside the dropdown registers before it closes.
          setTimeout(() => {
            if (isCreating) return;
            closeDropdown();
            if (hasMention(value)) setIsEditing(false);
          }, 150);
        }}
        placeholder={placeholder}
        rows={1}
        className="min-h-9 w-full resize-none overflow-hidden rounded border border-black/15 px-2 py-1.5 text-sm leading-normal whitespace-pre-wrap dark:border-white/15 dark:bg-transparent"
      />

      {query !== null && isCreating ? (
        <div className="absolute z-10 mt-1 w-64 space-y-2 rounded border border-black/15 bg-white p-2 shadow-lg dark:border-white/15 dark:bg-black">
          <p className="text-xs text-black/60 dark:text-white/60">
            Create <span className="font-medium">&quot;{query.trim()}&quot;</span> as:
          </p>
          {createError ? <p className="text-xs text-red-700 dark:text-red-300">{createError}</p> : null}
          {types === null ? (
            <p className="text-xs text-black/50 dark:text-white/50">Loading types…</p>
          ) : isNewTypeEntry ? (
            <div className="flex gap-1">
              <input
                autoFocus
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="e.g. creature, place, npc"
                className="w-full rounded border border-black/15 px-2 py-1 text-xs dark:border-white/15 dark:bg-transparent"
              />
              {types.length > 0 ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setIsNewTypeEntry(false);
                    setNewType(types[0] ?? "");
                  }}
                  className="shrink-0 rounded border border-black/15 px-2 text-xs dark:border-white/15"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          ) : (
            <select
              value={newType}
              onChange={(e) => {
                if (e.target.value === NEW_TYPE_VALUE) {
                  setIsNewTypeEntry(true);
                  setNewType("");
                } else {
                  setNewType(e.target.value);
                }
              }}
              className="w-full rounded border border-black/15 px-2 py-1 text-xs dark:border-white/15 dark:bg-transparent"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value={NEW_TYPE_VALUE}>+ Add new type…</option>
            </select>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={closeDropdown}
              className="rounded px-2 py-1 text-xs text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              disabled={isSubmittingCreate || !newType.trim()}
              className="rounded bg-black px-2 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {isSubmittingCreate ? "Creating…" : "Create & link"}
            </button>
          </div>
        </div>
      ) : query !== null && itemCount > 0 ? (
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
          {query.trim() ? (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={startCreating}
                className={`block w-full px-2 py-1.5 text-left text-sm ${
                  activeIndex === results.length ? "bg-black/5 dark:bg-white/10" : ""
                }`}
              >
                + Create &quot;{query.trim()}&quot;…
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
