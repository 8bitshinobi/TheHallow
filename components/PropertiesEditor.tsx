"use client";

import { useEffect, useRef, useState } from "react";

type Row = { id: string; key: string; value: string };

type Props = {
  properties: Record<string, string>;
  onChange: (properties: Record<string, string>) => void;
};

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

/** A textarea that grows to fit its content, including soft-wrapped lines. */
function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className="min-h-9 flex-1 resize-none overflow-hidden rounded border border-black/15 px-2 py-1.5 text-sm leading-normal whitespace-pre-wrap dark:border-white/15 dark:bg-transparent"
    />
  );
}

export function PropertiesEditor({ properties, onChange }: Props) {
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

    return (
      <div key={row.id} className="flex gap-2">
        <input
          value={label}
          onChange={(e) => updateKey(row.id, group, e.target.value)}
          placeholder="Field"
          className="h-9 w-1/3 shrink-0 self-start rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15 dark:bg-transparent"
        />
        <AutoGrowTextarea
          value={row.value}
          onChange={(value) => updateValue(row.id, value)}
          placeholder="Value"
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
