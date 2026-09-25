"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { rethrowIfRedirectError } from "@/lib/utils";

type Props = {
  label: string;
  placeholder: string;
  create: (name: string) => Promise<{ id: string }>;
  detailPathPrefix: string;
};

export function NewNamedObjectForm({ label, placeholder, create, detailPathPrefix }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const { id } = await create(name);
        router.push(`${detailPathPrefix}/${id}`);
      } catch (err) {
        rethrowIfRedirectError(err);
        setError(err instanceof Error ? err.message : "Failed to create.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="shrink-0 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {isPending ? "Creating…" : label}
      </button>
    </form>
  );
}
