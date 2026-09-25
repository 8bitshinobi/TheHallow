"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPlotBeatInArc } from "@/app/arcs/actions";
import { rethrowIfRedirectError } from "@/lib/utils";

type PlotBeat = { id: string; name: string; icon?: string };

export function ArcPlotBeatsPanel({ arcId, plotBeats }: { arcId: string; plotBeats: PlotBeat[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const { id } = await createPlotBeatInArc(arcId, name);
        setName("");
        router.push(`/objects/${id}`);
      } catch (err) {
        rethrowIfRedirectError(err);
        setError(err instanceof Error ? err.message : "Failed to create plot beat.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {plotBeats.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">No plot beats linked to this arc yet.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {plotBeats.map((beat) => (
            <li key={beat.id} className="px-3 py-2 text-sm">
              <Link href={`/objects/${beat.id}`} className="hover:underline">
                <span aria-hidden>{beat.icon}</span> {beat.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New plot beat name…"
          className="flex-1 rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15 dark:bg-transparent"
        />
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="rounded border border-black/15 px-3 py-1 text-sm disabled:opacity-50 dark:border-white/15"
        >
          {isPending ? "Creating…" : "+ New plot beat"}
        </button>
      </form>
    </div>
  );
}
