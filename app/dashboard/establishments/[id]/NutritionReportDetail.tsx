"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNutritionReport } from "@/hooks/useNutritionReport";
import { useNutritionReportPdf } from "@/hooks/useNutritionReportPdf";
import {
  NUTRITION_REPORT_DETAIL as COPY,
  NUTRITION_REPORT_NOTICE as NOTICE,
  nutritionReportListHref,
} from "@/constants/nutritionReport";
import { formatPercentage, formatReportMonth } from "@/lib/format";
import { isClosedMonth } from "@/lib/reportMonth";
import NutritionReportBanner from "./NutritionReportBanner";
import NutritionReportLoadError from "./NutritionReportLoadError";
import NutritionReportNoticeDialog from "./NutritionReportNoticeDialog";
import {
  DataLimitations,
  ExcludedFoodsNotice,
  GapaGroupsTable,
  MacrosTable,
  NutrientsTable,
  QUOTE_CLASS,
  SECTION_TITLE_CLASS,
  SuggestedFoods,
} from "./NutritionReportSections";
import { NutritionReportResponse } from "@/types/nutritionReport";

/** Fades in, so arriving from the generate dialog does not cut the screen in. */
const CARD_CLASS =
  "min-w-0 flex-1 p-4 md:p-8 flex flex-col gap-6 animate-in fade-in duration-300";

/** The report's content. The detailed sections are added on top of this. The
 * scope note is not part of it: it closes the screen, whatever the sections. */
function ReportContent({ report }: { report: NutritionReportResponse }) {
  if (!report.has_data)
    return (
      <NutritionReportBanner tone="warning">
        {COPY.noData}
      </NutritionReportBanner>
    );

  return (
    <div className="flex flex-col gap-8">
      {report.summary_status === "unavailable" && (
        <NutritionReportBanner tone="warning">
          {COPY.summaryUnavailable}
        </NutritionReportBanner>
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
        <section className="flex flex-col gap-2">
          <h2 className={SECTION_TITLE_CLASS}>{COPY.overviewTitle}</h2>
          <p className="text-sm">{report.summary.overview}</p>
        </section>
      )}

      <ExcludedFoodsNotice foods={report.analysis.foods_without_conversion} />

      <NutrientsTable
        nutrients={report.analysis.nutrients}
        commentary={report.summary?.at_risk_nutrients}
      />
      <MacrosTable
        macros={report.analysis.macros}
        commentary={report.summary?.macros}
      />
      <GapaGroupsTable
        groups={report.analysis.gapa_groups}
        commentary={report.summary?.gapa_groups}
      />
      <SuggestedFoods
        sources={report.analysis.top_sources}
        nutrients={report.analysis.nutrients}
        commentary={report.summary?.incorporate}
      />

      {report.summary && (
        <section className="flex flex-col gap-2">
          <h2 className={SECTION_TITLE_CLASS}>{COPY.conclusionTitle}</h2>
          <p className="text-sm">{report.summary.conclusion}</p>
        </section>
      )}

      <DataLimitations items={report.summary?.limitations ?? []} />
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

  const listHref = nutritionReportListHref(establishmentId);
  const textUnavailable = report?.summary_status === "unavailable";
  // A month saved without intakes may have them now: the backend calculates it
  // again on request. If it came back empty again nothing on screen changes, so
  // a dialog says so.
  const [unchangedNotice, setUnchangedNotice] = useState(false);
  const noData = report ? !report.has_data : false;
  const handleRecalculate = async () => {
    const recalculated = await generate();
    if (recalculated && !recalculated.has_data) setUnchangedNotice(true);
  };
  const missing = validMonth === null || report === null;

  return (
    <div className="flex flex-1 p-4">
      <Card className={CARD_CLASS}>
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
                    variant="outline"
                    onClick={() => void generate()}
                    disabled={isGenerating}
                  >
                    {isGenerating ? COPY.generating : COPY.regenerateText}
                  </Button>
                )}
                {noData && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleRecalculate()}
                    disabled={isGenerating}
                  >
                    {isGenerating ? COPY.recalculating : COPY.recalculate}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => void pdf.download(report.month)}
                  disabled={pdf.isDownloading || textUnavailable}
                >
                  {pdf.isDownloading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Download size={14} />
                  )}
                  {pdf.isDownloading ? COPY.downloading : COPY.downloadPdf}
                </Button>
              </div>
            )}
          </div>
          {noData && (
            <p className="text-xs text-muted-foreground">{COPY.noDataHint}</p>
          )}
          {textUnavailable && (
            <p className="text-xs text-muted-foreground">
              {COPY.pdfBlockedHint}
            </p>
          )}
        </div>

        <Separator />

        {(generateError || pdf.error) && (
          <NutritionReportBanner tone="danger">
            {generateError ?? pdf.error}
          </NutritionReportBanner>
        )}

        <NutritionReportNoticeDialog
          notice={
            unchangedNotice
              ? {
                  title: NOTICE.unchangedTitle,
                  message: NOTICE.unchanged(formatReportMonth(month)),
                }
              : null
          }
          onClose={() => setUnchangedNotice(false)}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : loadError ? (
          <NutritionReportLoadError message={loadError} onRetry={refetch} />
        ) : missing ? (
          <p className="text-sm text-muted-foreground">{COPY.notGenerated}</p>
        ) : report ? (
          <ReportContent report={report} />
        ) : null}

        {report?.scope_note && (
          <blockquote className={QUOTE_CLASS}>{report.scope_note}</blockquote>
        )}
      </Card>
    </div>
  );
}
