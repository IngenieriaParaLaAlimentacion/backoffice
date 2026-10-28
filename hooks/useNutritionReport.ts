import { useCallback } from "react";
import useSWR from "swr";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import { getNutritionReportAction } from "@/services/nutritionReport.service";
import { NutritionReportResponse, ReportMonth } from "@/types/nutritionReport";
import { ApiError } from "@/lib/apiError";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import { SWR_CONFIG } from "@/lib/swr";
import { nutritionReportKey } from "@/hooks/nutritionReportKeys";
import { useGenerateNutritionReport } from "@/hooks/useGenerateNutritionReport";

/**
 * The saved report of one month of a comedor, plus the way to generate it.
 *
 * Reading uses `GET`, which never counts toward the AI usage limit; every
 * `PUT` does, so `generate` is only ever called from an explicit user action —
 * to create the report, to write its text again when the AI had failed or to
 * calculate a month saved without data again.
 *
 * `report` is `null` once the backend confirms the month has no saved report
 * (404), and `undefined` while that is still unknown.
 */
export function useNutritionReport(
  establishmentId: string,
  month: ReportMonth | null,
) {
  const { makeAuthorizedRequest } = useAuth();
  const {
    generatingMonth,
    failure,
    generate: generateMonth,
  } = useGenerateNutritionReport(establishmentId);

  const key = month ? nutritionReportKey(establishmentId, month) : null;

  const {
    data,
    error,
    isLoading,
    mutate: refetchReport,
  } = useSWR<NutritionReportResponse | null, unknown>(
    key,
    async () => {
      try {
        return await getNutritionReportAction(
          makeAuthorizedRequest,
          establishmentId,
          month!,
        );
      } catch (err) {
        // Not having been generated yet is the normal state, not a failure.
        if (err instanceof ApiError && err.status === StatusCodes.NOT_FOUND)
          return null;
        throw err;
      }
    },
    // Another month's report must never stay on screen while this one loads,
    // and a 4xx won't fix itself on retry.
    { ...SWR_CONFIG, keepPreviousData: false, shouldRetryOnError: false },
  );

  const generate = useCallback(
    () => (month ? generateMonth(month) : Promise.resolve(null)),
    [generateMonth, month],
  );

  const refetch = useCallback(() => {
    void refetchReport();
  }, [refetchReport]);

  return {
    report: data,
    isLoading,
    loadError: error ? getNutritionReportErrorMessage(error) : null,
    isGenerating: month !== null && generatingMonth === month,
    generateError: failure && failure.month === month ? failure.message : null,
    generate,
    refetch,
  };
}
