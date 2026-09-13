import { GraphCanvas } from "@/components/GraphCanvas";
import { listAllEdges, listAllObjectsLight } from "@/lib/objects";

export default async function WholeArchiveGraphPage() {
  const [nodes, edges] = await Promise.all([listAllObjectsLight(), listAllEdges()]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">The Hallow — full connection graph</h1>
      <GraphCanvas nodes={nodes} edges={edges} linkMode="detail" />
    </div>
  );
}
