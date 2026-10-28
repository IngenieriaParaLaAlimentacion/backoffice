"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNutritionReport } from "@/hooks/useNutritionReport";
import { useNutritionReportPdf } from "@/hooks/useNutritionReportPdf";
import {
  NUTRITION_REPORT_DETAIL as COPY,
  NUTRITION_REPORT_TAB_PATH,
} from "@/constants/nutritionReport";
import { TONE_BANNER_CLASS } from "@/constants/theme";
import { formatPercentage, formatReportMonth } from "@/lib/format";
import { isClosedMonth } from "@/lib/reportMonth";
import { NutritionReportResponse } from "@/types/nutritionReport";

const BANNER = "rounded-md border px-4 py-3 text-sm";

/** The report's content. The detailed sections are added on top of this. */
function ReportContent({ report }: { report: NutritionReportResponse }) {
  if (!report.has_data)
    return (
      <p className={`${BANNER} ${TONE_BANNER_CLASS.warning}`} role="status">
        {COPY.noData}
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      {report.summary_status === "unavailable" && (
        <p className={`${BANNER} ${TONE_BANNER_CLASS.warning}`} role="status">
          {COPY.summaryUnavailable}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          {COPY.indicatorLabel}
        </span>
        <span className="text-2xl font-semibold">
          {formatPercentage(report.analysis.mean_adequacy_percent)}
        </span>
      </div>

      {report.summary && (
        <>
          <section className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">{COPY.overviewTitle}</h2>
            <p className="text-sm">{report.summary.overview}</p>
          </section>
          <section className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">{COPY.conclusionTitle}</h2>
            <p className="text-sm">{report.summary.conclusion}</p>
          </section>
        </>
      )}

      {report.scope_note && (
        <p className="text-xs text-muted-foreground">{report.scope_note}</p>
      )}
    </div>
  );
}

export default function NutritionReportDetail({
  establishmentId,
  month,
}: {
  establishmentId: string;
  month: string;
}) {
  // A hand-typed URL: never ask the backend about a month it can't have.
  const validMonth = isClosedMonth(month) ? month : null;
  const {
    report,
    isLoading,
    loadError,
    isGenerating,
    generateError,
    generate,
    refetch,
  } = useNutritionReport(establishmentId, validMonth);
  const pdf = useNutritionReportPdf(establishmentId);

  const listHref = `/dashboard/establishments/${establishmentId}/${NUTRITION_REPORT_TAB_PATH}`;
  const textUnavailable = report?.summary_status === "unavailable";
  const missing = validMonth === null || report === null;

  return (
    <div className="flex flex-1 p-4">
      <Card className="min-w-0 flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="self-start -ml-2"
            nativeButton={false}
            render={<Link href={listHref} />}
          >
            <ArrowLeft size={16} />
            {COPY.back}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold">
              {COPY.title(formatReportMonth(month))}
            </h1>
            {report && (
              <div className="flex flex-wrap items-center gap-2">
                {textUnavailable && (
                  <Button
                    size="sm"
                    onClick={() => void generate()}
                    disabled={isGenerating}
                  >
                    {isGenerating ? COPY.generating : COPY.regenerateText}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void pdf.download(report.month)}
                  disabled={pdf.isDownloading || textUnavailable}
                >
                  {pdf.isDownloading ? COPY.downloading : COPY.downloadPdf}
                </Button>
              </div>
            )}
          </div>
          {textUnavailable && (
            <p className="text-xs text-muted-foreground">
              {COPY.pdfBlockedHint}
            </p>
          )}
        </div>

        <Separator />

        {(generateError || pdf.error) && (
          <p role="alert" className={`${BANNER} ${TONE_BANNER_CLASS.danger}`}>
            {generateError ?? pdf.error}
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-start gap-2">
            <p
              role="alert"
              className={`${BANNER} ${TONE_BANNER_CLASS.danger} w-full`}
            >
              {loadError}
            </p>
            <Button size="sm" variant="outline" onClick={refetch}>
              {COPY.retry}
            </Button>
          </div>
        ) : missing ? (
          <p className="text-sm text-muted-foreground">{COPY.notGenerated}</p>
        ) : report ? (
          <ReportContent report={report} />
        ) : null}
      </Card>
    </div>
  );
}
