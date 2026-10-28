"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNutritionReport } from "@/hooks/useNutritionReport";
import { SELECT_CLASS } from "@/constants/establishments";
import {
  NUTRITION_REPORT_DIALOG as COPY,
  nutritionReportHref,
} from "@/constants/nutritionReport";
import {
  DIALOG_POPUP_CLASS,
  OVERLAY_CLASS,
  TONE_BANNER_CLASS,
} from "@/constants/theme";
import { formatReportMonth } from "@/lib/format";
import { closedMonthOptions, lastClosedMonth } from "@/lib/reportMonth";
import { cn } from "@/lib/utils";

/**
 * Mounted only while the dialog is open, so every opening starts again from
 * the default month with no stale state.
 */
function DialogBody({ establishmentId }: { establishmentId: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(() => lastClosedMonth());
  const {
    report,
    isLoading,
    loadError,
    isGenerating,
    generateError,
    generate,
  } = useNutritionReport(establishmentId, month);
  // Between the report being saved and the next screen showing up the dialog
  // would otherwise flip to "ya existe": keep saying we are on our way.
  const [isOpening, setIsOpening] = useState(false);
  const href = nutritionReportHref(establishmentId, month);
  const isBusy = isGenerating || isOpening;

  const handleGenerate = async () => {
    if (!(await generate())) return;
    setIsOpening(true);
    router.push(href);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="nutrition-report-month"
          className="text-xs text-muted-foreground"
        >
          {COPY.monthLabel}
        </label>
        <select
          id="nutrition-report-month"
          value={month}
          disabled={isBusy}
          onChange={(e) => setMonth(e.target.value)}
          className={`${SELECT_CLASS} w-full`}
        >
          {closedMonthOptions().map((option) => (
            <option key={option} value={option}>
              {formatReportMonth(option)}
            </option>
          ))}
        </select>
      </div>

      {(loadError || generateError) && (
        <p
          role="alert"
          className={`rounded-md border px-4 py-3 text-sm ${TONE_BANNER_CLASS.danger}`}
        >
          {generateError ?? loadError}
        </p>
      )}

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={14} />
          {COPY.checking}
        </p>
      ) : report && !isOpening ? (
        <p className="text-sm text-muted-foreground">{COPY.alreadyExists}</p>
      ) : null}

      {isGenerating && (
        <p className="text-xs text-muted-foreground" role="status">
          {COPY.generatingHint}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Dialog.Close
          render={<Button type="button" variant="ghost" disabled={isBusy} />}
        >
          {COPY.cancel}
        </Dialog.Close>
        {report && !isOpening ? (
          <Button
            // A next/link <a>, not a <button>.
            nativeButton={false}
            render={<Link href={href} />}
          >
            {COPY.viewExisting}
          </Button>
        ) : (
          <Button
            // Never while the month is still being looked up: the lookup is
            // what tells an existing report (free to open) from a missing one.
            disabled={isLoading || isBusy || report === undefined}
            onClick={() => void handleGenerate()}
          >
            {isOpening
              ? COPY.opening
              : isGenerating
                ? COPY.generating
                : COPY.generate}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function GenerateNutritionReportDialog({
  establishmentId,
  open,
  onOpenChange,
}: {
  establishmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn("fixed inset-0 z-[60]", OVERLAY_CLASS)}
        />
        <Dialog.Popup className={cn(DIALOG_POPUP_CLASS, "z-[70] max-w-md")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold">
                {COPY.title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {COPY.description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={COPY.close}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <DialogBody establishmentId={establishmentId} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
