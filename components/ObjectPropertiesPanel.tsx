"use client";

import { useState, useTransition } from "react";
import { updateObject } from "@/app/objects/actions";
import { PropertiesEditor } from "@/components/PropertiesEditor";
import { fallbackGraphLabel } from "@/lib/graphLabel";
import { iconFor } from "@/lib/icons";
import { rethrowIfRedirectError } from "@/lib/utils";
import type { HallowObject } from "@/lib/types";

export function ObjectPropertiesPanel({ object }: { object: HallowObject }) {
  const [name, setName] = useState(object.name);
  // The icon and graph label each have their own input below, so they're
  // kept out of the generic properties editor (which would otherwise
  // overwrite them) and merged back in on save.
  const { icon: initialIcon = "", label: initialLabel = "", ...otherProperties } = object.properties;
  const [icon, setIcon] = useState(initialIcon);
  const [label, setLabel] = useState(initialLabel);
  const [properties, setProperties] = useState(otherProperties);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setError(null);
    setSaved(false);

    const cleanedProperties = Object.fromEntries(
      Object.entries(properties).filter(([key]) => key.trim() !== "")
    );

    if (icon.trim()) cleanedProperties.icon = icon.trim();
    if (label.trim()) cleanedProperties.label = label.trim();

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
        <label htmlFor="icon" className="text-sm font-medium">
          Icon
        </label>
        <div className="flex items-center gap-3">
          <input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={16}
            placeholder={iconFor(object.type, { ...properties })}
            className="w-20 rounded border border-black/15 px-3 py-2 text-center text-sm dark:border-white/15 dark:bg-transparent"
          />
          <span className="text-xs text-black/50 dark:text-white/50">
            Optional emoji that overrides the automatic one. Leave blank to use the default.
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="graph-label" className="text-sm font-medium">
          Graph label
        </label>
        <div className="flex items-center gap-3">
          <input
            id="graph-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
            placeholder={fallbackGraphLabel(name)}
            className="w-48 rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
          />
          <span className="text-xs text-black/50 dark:text-white/50">
            Short name shown under this node on the graph. Leave blank to use the first word or
            two of the name above, which can get truncated for longer names.
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Properties</span>
        <PropertiesEditor
          properties={properties}
          onChange={setProperties}
          objectId={object.id}
          npcFieldContext={{ placeType: object.type, placeCategory: properties.category, placeName: name }}
        />
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
