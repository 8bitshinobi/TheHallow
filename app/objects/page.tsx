import Link from "next/link";
import { listObjects, listObjectTypes } from "@/lib/objects";

export default async function ObjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const [objects, types] = await Promise.all([listObjects(type), listObjectTypes()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Objects</h1>
        <Link
          href="/objects/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          + New object
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/objects"
          className={`rounded-full border px-3 py-1 text-xs ${
            !type
              ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
              : "border-black/15 dark:border-white/15"
          }`}
        >
          All
        </Link>
        {types.map((t) => (
          <Link
            key={t}
            href={`/objects?type=${encodeURIComponent(t)}`}
            className={`rounded-full border px-3 py-1 text-xs ${
              type === t
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : "border-black/15 dark:border-white/15"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {objects.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          No objects yet. Create the first one.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {objects.map((object) => (
            <li key={object.id} className="py-2">
              <Link href={`/objects/${object.id}`} className="text-sm">
                <span className="text-black/50 dark:text-white/50">{object.type}</span>{" "}
                <span className="font-medium">{object.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
