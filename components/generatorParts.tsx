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
  onReroll,
  children,
}: {
  label: string;
  onReroll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div>
        <div className="text-xs text-black/50 dark:text-white/50">{label}</div>
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
