"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { RowChevron } from "@/components/listings/RowAffordance";
import { useNutritionReportList } from "@/hooks/useNutritionReportList";
import {
  NUTRITION_REPORT_PAGE as COPY,
  nutritionReportHref,
} from "@/constants/nutritionReport";
import { TONE_BANNER_CLASS } from "@/constants/theme";
import { formatReportMonth, formatTimestampDate } from "@/lib/format";
import GenerateNutritionReportDialog from "./GenerateNutritionReportDialog";

/** The "Reporte nutricional" tab: the comedor's saved reports, newest first. */
export default function NutritionReportPanel({
  establishmentId,
}: {
  establishmentId: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    reports,
    total,
    page,
    totalPages,
    setPage,
    isLoading,
    error,
    refetch,
  } = useNutritionReportList(establishmentId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex h-8 items-center text-muted-foreground text-sm">
          {COPY.subtitle(total)}
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={14} />
          {COPY.newReport}
        </Button>
      </div>

      <GenerateNutritionReportDialog
        establishmentId={establishmentId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {error && (
        <div className="flex flex-col items-start gap-2">
          <p
            role="alert"
            className={`w-full rounded-md border px-4 py-3 text-sm ${TONE_BANNER_CLASS.danger}`}
          >
            {error}
          </p>
          <Button size="sm" variant="outline" onClick={refetch}>
            {COPY.retry}
          </Button>
        </div>
      )}

      {isLoading && reports.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : reports.length === 0 ? (
        !error && (
          <div className="flex items-center justify-center py-8 text-center text-muted-foreground text-sm">
            {COPY.empty}
          </div>
        )
      ) : (
        <ul className="flex flex-col divide-y rounded-md border">
          {reports.map((item) => (
            <li key={item.id}>
              <Link
                href={nutritionReportHref(establishmentId, item.month)}
                className="group flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium group-hover:underline">
                    {formatReportMonth(item.month)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {COPY.columns.createdAt}{" "}
                    {formatTimestampDate(item.created_at)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {COPY.summaryStatus[item.summary_status]}
                  </span>
                  <RowChevron />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
