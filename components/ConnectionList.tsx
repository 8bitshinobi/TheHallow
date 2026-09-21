import Link from "next/link";
import { DeleteEdgeButton } from "@/components/DeleteEdgeButton";
import type { ConnectedObject } from "@/lib/types";

export function ConnectionList({
  title,
  connections,
  currentObjectId,
  arrow,
}: {
  title: string;
  connections: ConnectedObject[];
  currentObjectId: string;
  arrow: "outgoing" | "incoming";
}) {
  if (connections.length === 0) {
    return (
      <div>
        <h2 className="mb-1 text-sm font-medium text-black/60 dark:text-white/60">
          {title}
        </h2>
        <p className="text-sm text-black/40 dark:text-white/40">None yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-sm font-medium text-black/60 dark:text-white/60">
        {title}
      </h2>
      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {connections.map((connection) => (
          <li key={connection.edgeId} className="flex items-center justify-between py-1.5">
            <span className="text-sm">
              {arrow === "outgoing" ? "→ " : "← "}
              <span aria-hidden>{connection.object.icon}</span>{" "}
              <Link href={`/objects/${connection.object.id}`} className="underline">
                {connection.object.name}
              </Link>{" "}
              <span className="text-black/50 dark:text-white/50">
                ({connection.object.type}
                {connection.label ? `, ${connection.label}` : ""})
              </span>
            </span>
            <DeleteEdgeButton edgeId={connection.edgeId} refreshObjectId={currentObjectId} />
          </li>
        ))}
      </ul>
    </div>
  );
}
