import { notFound } from "next/navigation";
import { ConnectionList } from "@/components/ConnectionList";
import { ConnectionPicker } from "@/components/ConnectionPicker";
import { DeleteObjectButton } from "@/components/DeleteObjectButton";
import { ObjectPropertiesPanel } from "@/components/ObjectPropertiesPanel";
import {
  getIncomingConnections,
  getObject,
  getOutgoingConnections,
} from "@/lib/objects";

export default async function ObjectDetailPage({
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

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">{object.type}</p>
          <h1 className="text-xl font-semibold">{object.name}</h1>
        </div>
        <DeleteObjectButton objectId={object.id} objectName={object.name} />
      </div>

      <ObjectPropertiesPanel key={object.id} object={object} />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          Connections
        </h2>
        <ConnectionPicker objectId={object.id} />
        <ConnectionList
          title="Outgoing"
          connections={outgoing}
          currentObjectId={object.id}
          arrow="outgoing"
        />
        <ConnectionList
          title="Backlinks"
          connections={incoming}
          currentObjectId={object.id}
          arrow="incoming"
        />
      </section>
    </div>
  );
}
