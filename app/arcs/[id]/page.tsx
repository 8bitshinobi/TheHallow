import Link from "next/link";
import { notFound } from "next/navigation";
import { ArcPlotBeatsPanel } from "@/components/ArcPlotBeatsPanel";
import { DeleteObjectButton } from "@/components/DeleteObjectButton";
import { iconFor } from "@/lib/icons";
import { getObject, getOutgoingConnections } from "@/lib/objects";

export default async function ArcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const arc = await getObject(id);

  if (!arc || arc.type.toLowerCase() !== "arc") notFound();

  const outgoing = await getOutgoingConnections(id);
  const plotBeats = outgoing
    .filter((c) => c.object.type.toLowerCase() === "plot_beat")
    .map((c) => ({ id: c.object.id, name: c.object.name, icon: c.object.icon }));

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">arc</p>
          <h1 className="text-xl font-semibold">
            <span aria-hidden>{iconFor(arc.type, arc.properties)}</span> {arc.name}
          </h1>
          <Link href={`/objects/${arc.id}`} className="text-xs underline">
            Edit object details →
          </Link>
        </div>
        <DeleteObjectButton objectId={arc.id} objectName={arc.name} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          Plot beats
        </h2>
        <ArcPlotBeatsPanel arcId={arc.id} plotBeats={plotBeats} />
      </section>
    </div>
  );
}
