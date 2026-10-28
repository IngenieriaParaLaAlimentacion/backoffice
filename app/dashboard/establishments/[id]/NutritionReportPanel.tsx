"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { RowChevron } from "@/components/listings/RowAffordance";
import { useNutritionReportList } from "@/hooks/useNutritionReportList";
import { useNutritionReportPdf } from "@/hooks/useNutritionReportPdf";
import { SELECT_CLASS } from "@/constants/establishments";
import {
  NUTRITION_REPORT_PAGE as COPY,
  nutritionReportHref,
} from "@/constants/nutritionReport";
import { TONE_BANNER_CLASS } from "@/constants/theme";
import { formatReportMonth, formatTimestampDate } from "@/lib/format";
import { NutritionReportSortOrder, ReportMonth } from "@/types/nutritionReport";
import GenerateNutritionReportDialog from "./GenerateNutritionReportDialog";
import NutritionReportActionsMenu from "./NutritionReportActionsMenu";

/** The "Reporte nutricional" tab: the comedor's saved reports. */
export default function NutritionReportPanel({
  establishmentId,
}: {
  establishmentId: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloadingMonth, setDownloadingMonth] = useState<ReportMonth | null>(
    null,
  );
  const {
    reports,
    total,
    page,
    totalPages,
    setPage,
    sortOrder,
    setSortOrder,
    isLoading,
    error,
    refetch,
  } = useNutritionReportList(establishmentId);
  const pdf = useNutritionReportPdf(establishmentId);

  const handleDownload = async (month: ReportMonth) => {
    setDownloadingMonth(month);
    await pdf.download(month);
    setDownloadingMonth(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex h-8 items-center text-muted-foreground text-sm">
          {COPY.subtitle(total)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={COPY.sortLabel}
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as NutritionReportSortOrder)
            }
            className={`${SELECT_CLASS} w-full sm:w-52`}
          >
            {COPY.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={14} />
            {COPY.newReport}
          </Button>
        </div>
      </div>

      <GenerateNutritionReportDialog
        establishmentId={establishmentId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {pdf.error && (
        <p
          role="alert"
          className={`rounded-md border px-4 py-3 text-sm ${TONE_BANNER_CLASS.danger}`}
        >
          {pdf.error}
        </p>
      )}

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
            // The row is a link and the menu its sibling: a button cannot live
            // inside an anchor.
            <li
              key={item.id}
              className="flex items-center gap-2 pr-2 transition-colors hover:bg-muted"
            >
              <Link
                href={nutritionReportHref(establishmentId, item.month)}
                className="group flex flex-1 items-center justify-between gap-3 py-3 pl-4 text-sm"
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
              <NutritionReportActionsMenu
                establishmentId={establishmentId}
                report={item}
                busy={downloadingMonth === item.month}
                onDownload={() => void handleDownload(item.month)}
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
