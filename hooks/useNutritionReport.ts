import { useCallback, useState } from "react";
import useSWR, { mutate } from "swr";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import {
  generateNutritionReportAction,
  getNutritionReportAction,
} from "@/services/nutritionReport.service";
import { NutritionReportResponse, ReportMonth } from "@/types/nutritionReport";
import { ApiError } from "@/lib/apiError";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import { SWR_CONFIG } from "@/lib/swr";
import {
  nutritionReportKey,
  nutritionReportsListMatcher,
} from "@/hooks/nutritionReportKeys";

type Failure = { month: ReportMonth; message: string };

/**
 * The saved report of one month of a comedor, plus the way to generate it.
 *
 * Reading uses `GET`, which never spends the AI quota; `PUT` always does, so
 * `generate` is only ever called from an explicit user action — to create the
 * report or to write its text again when the AI had failed.
 *
 * `report` is `null` once the backend confirms the month has no saved report
 * (404), and `undefined` while that is still unknown.
 */
export function useNutritionReport(
  establishmentId: string,
  month: ReportMonth | null,
) {
  const { makeAuthorizedRequest } = useAuth();
  const [generatingMonth, setGeneratingMonth] = useState<ReportMonth | null>(
    null,
  );
  const [failure, setFailure] = useState<Failure | null>(null);

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

  const generate = useCallback(async () => {
    if (!month || generatingMonth) return;
    setGeneratingMonth(month);
    setFailure(null);
    try {
      const report = await generateNutritionReportAction(
        makeAuthorizedRequest,
        establishmentId,
        month,
      );
      await mutate(nutritionReportKey(establishmentId, month), report, {
        revalidate: false,
      });
      await mutate(nutritionReportsListMatcher(establishmentId));
    } catch (err) {
      setFailure({ month, message: getNutritionReportErrorMessage(err) });
    } finally {
      setGeneratingMonth(null);
    }
  }, [makeAuthorizedRequest, establishmentId, month, generatingMonth]);

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
