"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createObject } from "@/app/objects/actions";
import { PropertiesEditor } from "@/components/PropertiesEditor";
import { rethrowIfRedirectError } from "@/lib/utils";

export function ObjectCreateForm({ existingTypes }: { existingTypes: string[] }) {
  const router = useRouter();
  const [type, setType] = useState(existingTypes[0] ?? "");
  const [name, setName] = useState("");
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!type.trim() || !name.trim()) {
      setError("Type and name are required.");
      return;
    }

    const cleanedProperties = Object.fromEntries(
      Object.entries(properties).filter(([key]) => key.trim() !== "")
    );

    startTransition(async () => {
      try {
        const { id } = await createObject(type, name, cleanedProperties);
        router.push(`/objects/${id}`);
      } catch (err) {
        rethrowIfRedirectError(err);
        setError(err instanceof Error ? err.message : "Failed to create object.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="type" className="text-sm font-medium">
          Type
        </label>
        <input
          id="type"
          list="existing-types"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="e.g. creature, place, npc"
          className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
        />
        <datalist id="existing-types">
          {existingTypes.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
        />
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Properties</span>
        <PropertiesEditor properties={properties} onChange={setProperties} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {isPending ? "Creating…" : "Create object"}
      </button>
    </form>
  );
}
