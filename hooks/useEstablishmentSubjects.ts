import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentSubjectsAction } from "@/services/establishment.service";
import {
  EstablishmentSubjectListItem,
  EstablishmentSubjectSortOrder,
} from "@/types/establishment";
import { FILTER_DEBOUNCE_MS, PAGE_SIZE } from "@/constants/establishments";

export function useEstablishmentSubjects(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();

  const [subjects, setSubjects] = useState<EstablishmentSubjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] =
    useState<EstablishmentSubjectSortOrder>("measured_at_desc");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchSubjects = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      currentSortOrder: EstablishmentSubjectSortOrder,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listEstablishmentSubjectsAction(
          makeAuthorizedRequest,
          establishmentId,
          {
            page: currentPage,
            page_size: PAGE_SIZE,
            search: currentSearch || undefined,
            sort_order: currentSortOrder,
          },
        );
        setSubjects(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los sujetos",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, establishmentId],
  );

  useEffect(() => {
    fetchSubjects(page, debouncedSearch, sortOrder);
  }, [fetchSubjects, page, debouncedSearch, sortOrder]);

  const changeSortOrder = (next: EstablishmentSubjectSortOrder) => {
    setSortOrder(next);
    setPage(1);
  };

  return {
    subjects,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    search,
    setSearch,
    sortOrder,
    setSortOrder: changeSortOrder,
  };
}
