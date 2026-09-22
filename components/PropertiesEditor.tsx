"use client";

import { useState } from "react";
import { generateNpcForPlace } from "@/app/npcs/actions";
import { MentionTextarea } from "@/components/MentionTextarea";
import { hasMention } from "@/lib/mentions";
import { occupationForPlace } from "@/lib/npcs/placeOccupations";

type Row = { id: string; key: string; value: string };

type Props = {
  properties: Record<string, string>;
  onChange: (properties: Record<string, string>) => void;
  /** The object being edited, so property values can @-mention other objects without mentioning themselves. Omit when creating a brand-new object. */
  objectId?: string;
  /**
   * Enables the in-place "Generate NPC" button next to an innkeeper/
   * proprietor field. Omitted for brand-new objects (no place to link the
   * generated NPC to yet) and for objects with no occupation mapping.
   */
  npcFieldContext?: { placeType: string; placeCategory?: string; placeName: string };
};

/** Field labels (case-insensitive) that can generate an NPC in place. */
const NPC_FIELD_LABELS = new Set(["innkeeper", "proprietor"]);

function toRows(properties: Record<string, string>): Row[] {
  return Object.entries(properties).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value,
  }));
}

function toRecord(rows: Row[]): Record<string, string> {
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

/** "taxonomy.kingdom" -> { group: "taxonomy", label: "kingdom" }; "size" -> { group: null, label: "size" } */
function parseKey(key: string): { group: string | null; label: string } {
  const dotIndex = key.indexOf(".");
  if (dotIndex === -1) return { group: null, label: key };
  return { group: key.slice(0, dotIndex), label: key.slice(dotIndex + 1) };
}

export function PropertiesEditor({ properties, onChange, objectId, npcFieldContext }: Props) {
  const [npcGen, setNpcGen] = useState<Record<string, "pending" | "error">>({});
  const [npcGenError, setNpcGenError] = useState<Record<string, string>>({});
  const mappedOccupation = npcFieldContext
    ? occupationForPlace(npcFieldContext.placeType, npcFieldContext.placeCategory)
    : null;

  async function generateNpcForRow(row: Row) {
    if (!npcFieldContext) return;
    setNpcGen((prev) => ({ ...prev, [row.id]: "pending" }));
    setNpcGenError((prev) => ({ ...prev, [row.id]: "" }));
    const result = await generateNpcForPlace({
      placeType: npcFieldContext.placeType,
      placeCategory: npcFieldContext.placeCategory,
      placeName: npcFieldContext.placeName,
      existingName: !hasMention(row.value) && row.value.trim() ? row.value.trim() : undefined,
    });
    if ("error" in result) {
      setNpcGen((prev) => ({ ...prev, [row.id]: "error" }));
      setNpcGenError((prev) => ({ ...prev, [row.id]: result.error }));
      return;
    }
    updateValue(row.id, result.mention);
    setNpcGen((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
  }
  // Rows carry a stable id independent of their key text, so editing a key
  // (including typing a "." that moves it into a group) doesn't remount the
  // input and lose focus mid-keystroke.
  const [rows, setRows] = useState<Row[]>(() => toRows(properties));

  function commit(next: Row[]) {
    setRows(next);
    onChange(toRecord(next));
  }

  function updateKey(id: string, group: string | null, label: string) {
    const key = group ? `${group}.${label}` : label;
    commit(rows.map((row) => (row.id === id ? { ...row, key } : row)));
  }

  function updateValue(id: string, value: string) {
    commit(rows.map((row) => (row.id === id ? { ...row, value } : row)));
  }

  function removeRow(id: string) {
    commit(rows.filter((row) => row.id !== id));
  }

  function addRow(group: string | null) {
    commit([...rows, { id: crypto.randomUUID(), key: group ? `${group}.` : "", value: "" }]);
  }

  function addGroup() {
    const name = window.prompt("Group name (e.g. taxonomy)")?.trim();
    if (!name) return;
    addRow(name);
  }

  const ungrouped = rows.filter((row) => parseKey(row.key).group === null);
  const groupNames = Array.from(
    new Set(
      rows
        .map((row) => parseKey(row.key).group)
        .filter((group): group is string => group !== null)
    )
  ).sort();

  function renderRow(row: Row, group: string | null) {
    const { label } = parseKey(row.key);
    const showNpcButton = mappedOccupation && NPC_FIELD_LABELS.has(label.trim().toLowerCase());
    const npcState = npcGen[row.id];

    return (
      <div key={row.id} className="space-y-1">
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => updateKey(row.id, group, e.target.value)}
            placeholder="Field"
            className="h-9 w-1/3 shrink-0 self-start rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15 dark:bg-transparent"
          />
          <MentionTextarea
            value={row.value}
            onChange={(value) => updateValue(row.id, value)}
            placeholder="Value (type @ to link another object)"
            excludeId={objectId}
          />
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            className="h-9 self-start rounded px-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            aria-label={`Remove ${label || "property"}`}
          >
            ✕
          </button>
        </div>
        {showNpcButton && (
          <div className="ml-[calc(33.333%+0.5rem)] flex items-center gap-2">
            <button
              type="button"
              onClick={() => generateNpcForRow(row)}
              disabled={npcState === "pending"}
              className="text-xs text-black/60 underline hover:text-black disabled:opacity-50 dark:text-white/60 dark:hover:text-white"
            >
              {npcState === "pending" ? "Generating…" : "⚡ Generate NPC (Novice)"}
            </button>
            {npcState === "error" && (
              <span className="text-xs text-red-600 dark:text-red-400">{npcGenError[row.id]}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ungrouped.length > 0 ? (
        <div className="space-y-2">{ungrouped.map((row) => renderRow(row, null))}</div>
      ) : null}

      {groupNames.map((group) => (
        <details
          key={group}
          className="rounded border border-black/10 p-2 dark:border-white/10"
          open
        >
          <summary className="cursor-pointer text-sm font-medium capitalize">
            {group} ({rows.filter((row) => parseKey(row.key).group === group).length})
          </summary>
          <div className="mt-2 space-y-2">
            {rows
              .filter((row) => parseKey(row.key).group === group)
              .map((row) => renderRow(row, group))}
            <button
              type="button"
              onClick={() => addRow(group)}
              className="text-xs text-black/60 underline hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              + Add to {group}
            </button>
          </div>
        </details>
      ))}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => addRow(null)}
          className="text-sm text-black/60 underline hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          + Add property
        </button>
        <button
          type="button"
          onClick={addGroup}
          className="text-sm text-black/60 underline hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          + Add group
        </button>
      </div>
    </div>
  );
}
