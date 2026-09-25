import Link from "next/link";
import { createArc } from "@/app/arcs/actions";
import { NewNamedObjectForm } from "@/components/NewNamedObjectForm";
import { iconFor } from "@/lib/icons";
import { listArcs } from "@/lib/compilations";

export default async function ArcsPage() {
  const arcs = await listArcs();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Arcs</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        A top-level story arc container, holding an ordered set of plot beats.
      </p>

      <NewNamedObjectForm
        label="Create arc"
        placeholder="New arc name…"
        create={createArc}
        detailPathPrefix="/arcs"
      />

      {arcs.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">No arcs yet.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {arcs.map((arc) => (
            <li key={arc.id} className="px-3 py-2">
              <Link href={`/arcs/${arc.id}`} className="text-sm hover:underline">
                <span aria-hidden>{iconFor(arc.type, arc.properties)}</span> {arc.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
