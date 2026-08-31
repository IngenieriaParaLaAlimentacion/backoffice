"use client";

import { TriangleAlert, X } from "lucide-react";
import { TONE_BANNER_CLASS } from "@/constants/theme";
import { EXPORT } from "@/constants/exports";

/**
 * The failure half of `useCsvExport`, shared by every listing that exports.
 *
 * Styling comes from the tone scale rather than a hand-rolled tint so the
 * banner reads the same as every other callout in the app — see
 * `docs/architecture.md` § Theme.
 */
export default function ExportError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${TONE_BANNER_CLASS.danger}`}
    >
      <TriangleAlert size={18} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
        aria-label={EXPORT.closeAria}
      >
        <X size={16} />
      </button>
    </div>
  );
}
