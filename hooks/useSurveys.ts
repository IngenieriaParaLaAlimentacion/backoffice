import { useAuth } from "@/context/AuthContext";
import { listSurveysAction } from "@/services/survey.service";
import { SurveyListItem, SurveyResponseTarget } from "@/types/survey";
import { useCallback, useEffect, useState } from "react";

/** Empty string is the "Todos" option: no response_target sent at all. */
export type ResponseTargetFilter = SurveyResponseTarget | "";

export function useSurveys(pageSize: number) {
  const { makeAuthorizedRequest } = useAuth();
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearchValue] = useState("");
  const [responseTarget, setResponseTargetValue] =
    useState<ResponseTargetFilter>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      currentTarget: ResponseTargetFilter,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listSurveysAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: pageSize,
          search: currentSearch || undefined,
          response_target: currentTarget || undefined,
        });
        setSurveys(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar encuestas",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, pageSize],
  );

  useEffect(() => {
    fetchSurveys(page, search, responseTarget);
  }, [fetchSurveys, page, search, responseTarget]);

  // Reset to the first page whenever a filter changes.
  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const setResponseTarget = useCallback((value: ResponseTargetFilter) => {
    setResponseTargetValue(value);
    setPage(1);
  }, []);

  const refetch = useCallback(
    () => fetchSurveys(page, search, responseTarget),
    [fetchSurveys, page, search, responseTarget],
  );

  return {
    surveys,
    page,
    totalPages,
    search,
    setSearch,
    responseTarget,
    setResponseTarget,
    isLoading,
    error,
    setPage,
    refetch,
  };
}
