"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteObject } from "@/app/objects/actions";
import { rethrowIfRedirectError } from "@/lib/utils";

export function DeleteObjectButton({ objectId, objectName }: { objectId: string; objectName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete "${objectName}"? This also removes its connections.`)) return;

    startTransition(async () => {
      try {
        await deleteObject(objectId);
        router.push("/objects");
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
      className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 disabled:opacity-50 dark:border-red-900 dark:text-red-400"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
