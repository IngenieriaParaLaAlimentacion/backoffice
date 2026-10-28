import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { listNutritionReportsAction } from "@/services/nutritionReport.service";
import {
  NutritionReportSortOrder,
  PaginatedNutritionReportsResponse,
} from "@/types/nutritionReport";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import { SWR_CONFIG } from "@/lib/swr";
import { NUTRITION_REPORT_LIST_PAGE_SIZE } from "@/constants/nutritionReport";
import { nutritionReportsListKey } from "@/hooks/nutritionReportKeys";

export const DEFAULT_REPORT_SORT_ORDER: NutritionReportSortOrder = "month_desc";

/**
 * The reports already generated for a comedor, newest month first unless told
 * otherwise. Generating one (`useNutritionReport`) refreshes this list on its
 * own.
 */
export function useNutritionReportList(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrderState] = useState<NutritionReportSortOrder>(
    DEFAULT_REPORT_SORT_ORDER,
  );

  const { data, error, isLoading, mutate } = useSWR<
    PaginatedNutritionReportsResponse,
    unknown
  >(
    nutritionReportsListKey(establishmentId, page, sortOrder),
    () =>
      listNutritionReportsAction(makeAuthorizedRequest, establishmentId, {
        page,
        page_size: NUTRITION_REPORT_LIST_PAGE_SIZE,
        sort_order: sortOrder,
      }),
    { ...SWR_CONFIG, shouldRetryOnError: false },
  );

  return {
    reports: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    totalPages: data?.total_pages ?? 1,
    setPage,
    sortOrder,
    // Another order starts again from the first page.
    setSortOrder: (next: NutritionReportSortOrder) => {
      setSortOrderState(next);
      setPage(1);
    },
    isLoading,
    // A failed refresh keeps the list already on screen.
    error: data || !error ? null : getNutritionReportErrorMessage(error),
    refetch: () => void mutate(),
  };
}
