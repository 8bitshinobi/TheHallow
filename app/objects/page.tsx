import Link from "next/link";
import { iconFor } from "@/lib/icons";
import { GraphCanvas } from "@/components/GraphCanvas";
import { listAllEdges, listAllObjectsLight, listObjects, listObjectTypes } from "@/lib/objects";

export default async function ObjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const [objects, types, allNodes, allEdges] = await Promise.all([
    listObjects(type),
    listObjectTypes(),
    listAllObjectsLight(),
    listAllEdges(),
  ]);

  // The graph mirrors whatever type filter is active on the list: only
  // nodes of that type, and only edges where both ends survive the filter
  // (an edge to a filtered-out node would otherwise dangle).
  const graphNodes = type
    ? allNodes.filter((node) => node.type.toLowerCase() === type.toLowerCase())
    : allNodes;
  const graphNodeIds = new Set(graphNodes.map((node) => node.id));
  const graphEdges = allEdges.filter(
    (edge) => graphNodeIds.has(edge.from) && graphNodeIds.has(edge.to)
  );

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
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
                {iconFor(t)} {t}
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
                    <span aria-hidden>{iconFor(object.type, object.properties)}</span>{" "}
                    <span className="text-black/50 dark:text-white/50">{object.type}</span>{" "}
                    <span className="font-medium">{object.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
            {type ? `Graph — ${type}` : "Graph — all"}
          </h2>
          <GraphCanvas key={type ?? "all"} nodes={graphNodes} edges={graphEdges} linkMode="detail" />
        </div>
      </div>
    </div>
  );
}
