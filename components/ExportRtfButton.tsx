"use client";

import { useTransition } from "react";
import { exportCompilationRtf } from "@/app/compilations/actions";
import { rethrowIfRedirectError } from "@/lib/utils";

export function ExportRtfButton({ compilationId }: { compilationId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const { filename, content } = await exportCompilationRtf(compilationId);
        const blob = new Blob([content], { type: "application/rtf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        rethrowIfRedirectError(err);
        alert(err instanceof Error ? err.message : "Export failed.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
    >
      {isPending ? "Exporting…" : "Export RTF"}
    </button>
  );
}
