"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  cutEntry,
  moveEntryDown,
  moveEntryUp,
  placeEntry,
  removeEntry,
  restoreEntryToDraft,
  setEntryRoughEra,
} from "@/app/compilations/actions";
import { rethrowIfRedirectError } from "@/lib/utils";
import type { CompilationEntry } from "@/lib/types";

type Props = {
  compilationId: string;
  draft: CompilationEntry[];
  placed: CompilationEntry[];
  cut: CompilationEntry[];
};

function EntryLabel({ entry }: { entry: CompilationEntry }) {
  const hasNarrative = Boolean(entry.object.properties.narrative_text?.trim());
  return (
    <Link href={`/objects/${entry.object.id}`} className="text-sm hover:underline">
      <span aria-hidden>{entry.object.icon}</span>{" "}
      <span className="text-black/50 dark:text-white/50">{entry.object.type}</span>{" "}
      {entry.object.properties.title?.trim() || entry.object.name}
      {!hasNarrative ? (
        <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">(no narrative text)</span>
      ) : null}
    </Link>
  );
}

export function CompilationBuilder({ compilationId, draft, placed, cut }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [eraDrafts, setEraDrafts] = useState<Record<string, string>>({});

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        rethrowIfRedirectError(err);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const draftGroups = new Map<string, CompilationEntry[]>();
  for (const entry of draft) {
    const key = entry.rough_era?.trim() || "Unsorted";
    draftGroups.set(key, [...(draftGroups.get(key) ?? []), entry]);
  }
  const groupNames = Array.from(draftGroups.keys()).sort((a, b) =>
    a === "Unsorted" ? 1 : b === "Unsorted" ? -1 : a.localeCompare(b)
  );

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          Placed ({placed.length})
        </h2>
        {placed.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">
            Nothing placed yet. Place a draft entry below to give it a position in the reading order.
          </p>
        ) : (
          <ol className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
            {placed.map((entry, index) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-right text-xs text-black/40 dark:text-white/40">
                    {index + 1}
                  </span>
                  <EntryLabel entry={entry} />
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={isPending || index === 0}
                    onClick={() => run(() => moveEntryUp(entry.id, compilationId))}
                    className="rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-30 dark:border-white/15"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={isPending || index === placed.length - 1}
                    onClick={() => run(() => moveEntryDown(entry.id, compilationId))}
                    className="rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-30 dark:border-white/15"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => cutEntry(entry.id, compilationId))}
                    className="rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-50 dark:border-white/15"
                  >
                    Cut
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          Draft / staging ({draft.length})
        </h2>
        {draft.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">
            Nothing in staging. Use the search box above to add objects to this compilation.
          </p>
        ) : (
          <div className="space-y-4">
            {groupNames.map((group) => (
              <div key={group}>
                <p className="mb-1 text-xs font-medium uppercase text-black/40 dark:text-white/40">
                  {group} ({draftGroups.get(group)!.length})
                </p>
                <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
                  {draftGroups.get(group)!.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <EntryLabel entry={entry} />
                      <span className="flex shrink-0 items-center gap-1">
                        <input
                          defaultValue={entry.rough_era ?? ""}
                          placeholder="rough era…"
                          onChange={(e) =>
                            setEraDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))
                          }
                          onBlur={() => {
                            const value = eraDrafts[entry.id];
                            if (value === undefined || value === (entry.rough_era ?? "")) return;
                            run(() => setEntryRoughEra(entry.id, compilationId, value));
                          }}
                          className="w-28 rounded border border-black/15 px-2 py-1 text-xs dark:border-white/15 dark:bg-transparent"
                        />
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => run(() => placeEntry(entry.id, compilationId))}
                          className="rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-50 dark:border-white/15"
                        >
                          Place
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => run(() => cutEntry(entry.id, compilationId))}
                          className="rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-50 dark:border-white/15"
                        >
                          Cut
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => run(() => removeEntry(entry.id, compilationId))}
                          className="rounded px-2 py-1 text-xs text-red-600 disabled:opacity-50 dark:text-red-400"
                          aria-label="Remove from compilation"
                        >
                          ✕
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {cut.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
            Cut ({cut.length})
          </h2>
          <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
            {cut.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <EntryLabel entry={entry} />
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => restoreEntryToDraft(entry.id, compilationId))}
                    className="rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-50 dark:border-white/15"
                  >
                    Restore to draft
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => removeEntry(entry.id, compilationId))}
                    className="rounded px-2 py-1 text-xs text-red-600 disabled:opacity-50 dark:text-red-400"
                    aria-label="Remove from compilation"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
