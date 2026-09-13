import Link from "next/link";
import { notFound } from "next/navigation";
import { GraphCanvas } from "@/components/GraphCanvas";
import {
  buildNeighborhoodGraph,
  getIncomingConnections,
  getObject,
  getOutgoingConnections,
} from "@/lib/objects";

export default async function ObjectGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const object = await getObject(id);

  if (!object) notFound();

  const [outgoing, incoming] = await Promise.all([
    getOutgoingConnections(id),
    getIncomingConnections(id),
  ]);

  const graph = buildNeighborhoodGraph(object, outgoing, incoming);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <Link href={`/objects/${object.id}`} className="text-sm underline">
          ← Back to {object.name}
        </Link>
      </div>
      <h1 className="text-xl font-semibold">{object.name} — connection graph</h1>
      <GraphCanvas
        nodes={graph.nodes}
        edges={graph.edges}
        centerId={object.id}
        linkMode="recenter"
      />
    </div>
  );
}
