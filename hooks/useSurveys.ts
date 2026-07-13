import { useAuth } from "@/context/AuthContext";
import { listSurveysAction } from "@/services/survey.service";
import { SurveyListItem } from "@/types/survey";
import { useCallback, useEffect, useState } from "react";

export function useSurveys(pageSize: number) {
  const { makeAuthorizedRequest } = useAuth();
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = useCallback(
    async (currentPage: number, currentSearch: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listSurveysAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: pageSize,
          search: currentSearch || undefined,
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
    fetchSurveys(page, search);
  }, [fetchSurveys, page, search]);

  // Reset to the first page whenever the search term changes.
  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  return {
    surveys,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    setPage,
  };
}
