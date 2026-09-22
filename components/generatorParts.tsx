export function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-0.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function Field({
  label,
  /** Small pill next to the label — used for "rolled" (a blank field on a
   * real, established result, randomly filled in for display; not yet part
   * of the archive) so it's never confused for real content. */
  tag,
  onReroll,
  children,
}: {
  label: string;
  tag?: string;
  onReroll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div>
        <div className="text-xs text-black/50 dark:text-white/50">
          {label}
          {tag && (
            <span className="ml-2 rounded-full border border-dashed border-black/30 px-1.5 py-0.5 text-[10px] text-black/60 dark:border-white/30 dark:text-white/60">
              {tag}
            </span>
          )}
        </div>
        {children}
      </div>
      {onReroll && (
        <button type="button" onClick={onReroll} className="shrink-0 text-xs underline">
          reroll
        </button>
      )}
    </div>
  );
}
