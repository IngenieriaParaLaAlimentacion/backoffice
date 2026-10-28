import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { generateNutritionReportAction } from "@/services/nutritionReport.service";
import { NutritionReportResponse, ReportMonth } from "@/types/nutritionReport";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import { storeGeneratedReport } from "@/hooks/nutritionReportKeys";

/**
 * Calculates again a month that was saved without data, from the list: the
 * intakes of a month can be loaded after its report was generated. The backend
 * fills the report in if they arrived and writes nothing if not; either way it
 * counts toward the AI quota, so this only runs from an explicit action.
 */
export function useRecalculateNutritionReport(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();
  const [recalculatingMonth, setRecalculatingMonth] =
    useState<ReportMonth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const recalculate = useCallback(
    async (month: ReportMonth): Promise<NutritionReportResponse | null> => {
      if (recalculatingMonth) return null;
      setRecalculatingMonth(month);
      setError(null);
      try {
        const report = await generateNutritionReportAction(
          makeAuthorizedRequest,
          establishmentId,
          month,
        );
        await storeGeneratedReport(report);
        return report;
      } catch (err) {
        setError(getNutritionReportErrorMessage(err));
        return null;
      } finally {
        setRecalculatingMonth(null);
      }
    },
    [makeAuthorizedRequest, establishmentId, recalculatingMonth],
  );

  return { recalculatingMonth, error, clearError, recalculate };
}
