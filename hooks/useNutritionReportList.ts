import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { listNutritionReportsAction } from "@/services/nutritionReport.service";
import { PaginatedNutritionReportsResponse } from "@/types/nutritionReport";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import { SWR_CONFIG } from "@/lib/swr";
import { NUTRITION_REPORT_LIST_PAGE_SIZE } from "@/constants/nutritionReport";
import { nutritionReportsListKey } from "@/hooks/nutritionReportKeys";

/**
 * The reports already generated for a comedor, newest month first. Generating
 * one (`useNutritionReport`) refreshes this list on its own.
 */
export function useNutritionReportList(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();
  const [page, setPage] = useState(1);

  const { data, error, isLoading, mutate } = useSWR<
    PaginatedNutritionReportsResponse,
    unknown
  >(
    nutritionReportsListKey(establishmentId, page),
    () =>
      listNutritionReportsAction(makeAuthorizedRequest, establishmentId, {
        page,
        page_size: NUTRITION_REPORT_LIST_PAGE_SIZE,
        sort_order: "month_desc",
      }),
    { ...SWR_CONFIG, shouldRetryOnError: false },
  );

  return {
    reports: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    totalPages: data?.total_pages ?? 1,
    setPage,
    isLoading,
    // A failed refresh keeps the list already on screen.
    error: data || !error ? null : getNutritionReportErrorMessage(error),
    refetch: () => void mutate(),
  };
}
