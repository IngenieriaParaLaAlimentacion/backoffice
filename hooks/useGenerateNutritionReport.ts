import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { generateNutritionReportAction } from "@/services/nutritionReport.service";
import { NutritionReportResponse, ReportMonth } from "@/types/nutritionReport";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import { storeGeneratedReport } from "@/hooks/nutritionReportKeys";

type GenerationFailure = { month: ReportMonth; message: string };

/**
 * The `PUT` of a month's report: generates it, writes the text of one whose AI
 * had failed again, or calculates again a month saved without data. Every
 * call counts toward the per-user AI usage limit, even when it returns the
 * saved report, so it only ever runs from an explicit action.
 *
 * Knows which month is in flight and which one failed, so a screen showing
 * another month does not report them as its own.
 */
export function useGenerateNutritionReport(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();
  const [generatingMonth, setGeneratingMonth] = useState<ReportMonth | null>(
    null,
  );
  const [failure, setFailure] = useState<GenerationFailure | null>(null);

  /** Resolves to the saved report, or `null` when it could not be generated. */
  const generate = useCallback(
    async (month: ReportMonth): Promise<NutritionReportResponse | null> => {
      if (generatingMonth) return null;
      setGeneratingMonth(month);
      setFailure(null);
      try {
        const report = await generateNutritionReportAction(
          makeAuthorizedRequest,
          establishmentId,
          month,
        );
        await storeGeneratedReport(report);
        return report;
      } catch (err) {
        setFailure({ month, message: getNutritionReportErrorMessage(err) });
        return null;
      } finally {
        setGeneratingMonth(null);
      }
    },
    [makeAuthorizedRequest, establishmentId, generatingMonth],
  );

  return { generatingMonth, failure, generate };
}
