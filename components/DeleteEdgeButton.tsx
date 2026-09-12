"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteEdge } from "@/app/objects/actions";
import { rethrowIfRedirectError } from "@/lib/utils";

export function DeleteEdgeButton({
  edgeId,
  refreshObjectId,
}: {
  edgeId: string;
  refreshObjectId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await deleteEdge(edgeId, refreshObjectId);
        router.refresh();
      } catch (err) {
        rethrowIfRedirectError(err);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
    >
      Unlink
    </button>
  );
}
