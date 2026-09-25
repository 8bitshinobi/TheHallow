"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addEntryToCompilation } from "@/app/compilations/actions";
import { searchObjects } from "@/app/objects/actions";
import { rethrowIfRedirectError } from "@/lib/utils";
import type { HallowObject } from "@/lib/types";

type SearchResult = Pick<HallowObject, "id" | "type" | "name"> & { icon?: string };

export function CompilationEntryPicker({ compilationId }: { compilationId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const found = await searchObjects(value);
      setResults(found);
    } catch (err) {
      rethrowIfRedirectError(err);
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleAdd(target: SearchResult) {
    startTransition(async () => {
      try {
        await addEntryToCompilation(compilationId, target.id);
        setQuery("");
        setResults([]);
        router.refresh();
      } catch (err) {
        rethrowIfRedirectError(err);
        setError(err instanceof Error ? err.message : "Failed to add.");
      }
    });
  }

  return (
    <div className="space-y-2 rounded border border-black/10 p-3 dark:border-white/10">
      {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      <input
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Search objects to add to this compilation…"
        className="w-full rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15 dark:bg-transparent"
      />

      {isSearching ? <p className="text-sm text-black/50 dark:text-white/50">Searching…</p> : null}

      {results.length > 0 ? (
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {results.map((result) => (
            <li key={result.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm">
                <span aria-hidden>{result.icon}</span>{" "}
                <span className="text-black/50 dark:text-white/50">{result.type}</span>{" "}
                {result.name}
              </span>
              <button
                type="button"
                onClick={() => handleAdd(result)}
                disabled={isPending}
                className="rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-50 dark:border-white/15"
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
