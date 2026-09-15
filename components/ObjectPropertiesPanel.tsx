"use client";

import { useState, useTransition } from "react";
import { updateObject } from "@/app/objects/actions";
import { PropertiesEditor } from "@/components/PropertiesEditor";
import { rethrowIfRedirectError } from "@/lib/utils";
import type { HallowObject } from "@/lib/types";

export function ObjectPropertiesPanel({ object }: { object: HallowObject }) {
  const [name, setName] = useState(object.name);
  const [properties, setProperties] = useState(object.properties);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setError(null);
    setSaved(false);

    const cleanedProperties = Object.fromEntries(
      Object.entries(properties).filter(([key]) => key.trim() !== "")
    );

    startTransition(async () => {
      try {
        await updateObject(object.id, { name, properties: cleanedProperties });
        setSaved(true);
      } catch (err) {
        rethrowIfRedirectError(err);
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

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
        <PropertiesEditor properties={properties} onChange={setProperties} objectId={object.id} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {saved && !isPending ? (
          <span className="text-sm text-green-700 dark:text-green-400">Saved</span>
        ) : null}
      </div>
    </div>
  );
}
