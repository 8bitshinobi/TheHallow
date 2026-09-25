import Link from "next/link";
import { notFound } from "next/navigation";
import { CompilationBuilder } from "@/components/CompilationBuilder";
import { CompilationEntryPicker } from "@/components/CompilationEntryPicker";
import { DeleteObjectButton } from "@/components/DeleteObjectButton";
import { ExportRtfButton } from "@/components/ExportRtfButton";
import { getCompilationEntries } from "@/lib/compilations";
import { iconFor } from "@/lib/icons";
import { getObject } from "@/lib/objects";

export default async function CompilationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const compilation = await getObject(id);

  if (!compilation || compilation.type.toLowerCase() !== "compilation") notFound();

  const { draft, placed, cut } = await getCompilationEntries(id);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">compilation</p>
          <h1 className="text-xl font-semibold">
            <span aria-hidden>{iconFor(compilation.type, compilation.properties)}</span>{" "}
            {compilation.name}
          </h1>
          <Link href={`/objects/${compilation.id}`} className="text-xs underline">
            Edit object details →
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportRtfButton compilationId={compilation.id} />
          <DeleteObjectButton objectId={compilation.id} objectName={compilation.name} />
        </div>
      </div>

      <CompilationEntryPicker compilationId={compilation.id} />

      <CompilationBuilder compilationId={compilation.id} draft={draft} placed={placed} cut={cut} />
    </div>
  );
}
