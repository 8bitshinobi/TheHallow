"use client";

type Props = {
  properties: Record<string, string>;
  onChange: (properties: Record<string, string>) => void;
};

export function PropertiesEditor({ properties, onChange }: Props) {
  const rows = Object.entries(properties);

  function updateRow(index: number, key: string, value: string) {
    const next = [...rows];
    next[index] = [key, value];
    onChange(Object.fromEntries(next));
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    onChange(Object.fromEntries(next));
  }

  function addRow() {
    onChange({ ...properties, "": "" });
  }

  return (
    <div className="space-y-2">
      {rows.map(([key, value], index) => (
        <div key={index} className="flex gap-2">
          <input
            value={key}
            onChange={(e) => updateRow(index, e.target.value, value)}
            placeholder="Field"
            className="w-1/3 rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15 dark:bg-transparent"
          />
          <input
            value={value}
            onChange={(e) => updateRow(index, key, e.target.value)}
            placeholder="Value"
            className="flex-1 rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15 dark:bg-transparent"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="rounded px-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            aria-label={`Remove ${key || "property"}`}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-black/60 underline hover:text-black dark:text-white/60 dark:hover:text-white"
      >
        + Add property
      </button>
    </div>
  );
}
