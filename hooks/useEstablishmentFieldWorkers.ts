import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentFieldWorkersAction } from "@/services/establishment.service";
import {
  EstablishmentFieldWorkerListItem,
  RelationStatus,
} from "@/types/establishment";
import { FILTER_DEBOUNCE_MS, PAGE_SIZE } from "@/constants/establishments";

export function useEstablishmentFieldWorkers(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();

  const [fieldWorkers, setFieldWorkers] = useState<
    EstablishmentFieldWorkerListItem[]
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [relationStatus, setRelationStatus] =
    useState<RelationStatus>("approved");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchFieldWorkers = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      currentRelationStatus: RelationStatus,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listEstablishmentFieldWorkersAction(
          makeAuthorizedRequest,
          establishmentId,
          {
            page: currentPage,
            page_size: PAGE_SIZE,
            search: currentSearch || undefined,
            relation_status: currentRelationStatus,
          },
        );
        setFieldWorkers(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar los relevadores",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, establishmentId],
  );

  useEffect(() => {
    fetchFieldWorkers(page, debouncedSearch, relationStatus);
  }, [fetchFieldWorkers, page, debouncedSearch, relationStatus]);

  const changeRelationStatus = (next: RelationStatus) => {
    setRelationStatus(next);
    setPage(1);
  };

  return {
    fieldWorkers,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    search,
    setSearch,
    relationStatus,
    setRelationStatus: changeRelationStatus,
  };
}
