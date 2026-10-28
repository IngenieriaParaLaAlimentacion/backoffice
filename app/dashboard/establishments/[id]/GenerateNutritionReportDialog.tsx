"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNutritionReport } from "@/hooks/useNutritionReport";
import { SELECT_CLASS } from "@/constants/establishments";
import {
  NUTRITION_REPORT_DIALOG as COPY,
  nutritionReportHref,
} from "@/constants/nutritionReport";
import { formatReportMonth } from "@/lib/format";
import { closedMonthOptions, lastClosedMonth } from "@/lib/reportMonth";
import NutritionReportBanner from "./NutritionReportBanner";
import NutritionReportDialogFrame from "./NutritionReportDialogFrame";

/**
 * Mounted only while the dialog is open, so every opening starts again from
 * the default month with no stale state.
 */
function DialogBody({ establishmentId }: { establishmentId: string }) {
  const router = useRouter();
  const monthFieldId = useId();
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
    // Generating takes a while: have the screen ready by the time it is done.
    router.prefetch(href);
    if (!(await generate())) return;
    setIsOpening(true);
    router.push(href);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={monthFieldId} className="text-xs text-muted-foreground">
          {COPY.monthLabel}
        </label>
        <select
          id={monthFieldId}
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
        <NutritionReportBanner tone="danger">
          {generateError ?? loadError}
        </NutritionReportBanner>
      )}

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={14} />
          {COPY.checking}
        </p>
      ) : report && !isOpening ? (
        <p className="text-sm text-muted-foreground">{COPY.alreadyExists}</p>
      ) : null}

      {isOpening ? (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-success"
        >
          <Check size={14} />
          {COPY.generated}
        </p>
      ) : (
        isGenerating && (
          <p className="text-xs text-muted-foreground" role="status">
            {COPY.generatingHint}
          </p>
        )
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
            {COPY.viewReport}
          </Button>
        ) : (
          <Button
            // Never while the month is still being looked up: the lookup is
            // what tells an existing report (free to open) from a missing one.
            disabled={isLoading || isBusy || report === undefined}
            onClick={() => void handleGenerate()}
          >
            {isBusy && <Loader2 className="animate-spin" size={14} />}
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
    <NutritionReportDialogFrame
      open={open}
      onOpenChange={onOpenChange}
      widthClass="max-w-md"
    >
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
    </NutritionReportDialogFrame>
  );
}
