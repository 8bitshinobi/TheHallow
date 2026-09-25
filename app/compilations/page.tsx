import Link from "next/link";
import { createCompilation } from "@/app/compilations/actions";
import { NewNamedObjectForm } from "@/components/NewNamedObjectForm";
import { iconFor } from "@/lib/icons";
import { listCompilations } from "@/lib/compilations";

export default async function CompilationsPage() {
  const compilations = await listCompilations();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Compilations</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        An ordered, exportable reading of selected objects — stage a backlog of candidates, place the
        ones you want in order, then export to RTF.
      </p>

      <NewNamedObjectForm
        label="Create compilation"
        placeholder="New compilation name…"
        create={createCompilation}
        detailPathPrefix="/compilations"
      />

      {compilations.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">No compilations yet.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {compilations.map((compilation) => (
            <li key={compilation.id} className="px-3 py-2">
              <Link href={`/compilations/${compilation.id}`} className="text-sm hover:underline">
                <span aria-hidden>{iconFor(compilation.type, compilation.properties)}</span>{" "}
                {compilation.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
