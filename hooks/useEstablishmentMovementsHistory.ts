import { useCallback, useEffect, useState } from "react";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentFoodMovementsAction } from "@/services/establishment.service";
import {
  FoodMovementDirection,
  FoodMovementListItem,
} from "@/types/establishment";
import {
  ESTABLISHMENT_MOVEMENTS_PAGE,
  FILTER_DEBOUNCE_MS,
  PAGE_SIZE,
} from "@/constants/establishments";
import { ApiError } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { argentineDayEndUtc, argentineDayStartUtc } from "@/lib/format";

/** `""` is "both directions", i.e. no `direction` param at all. */
export type MovementDirectionFilter = "" | FoodMovementDirection;

export type MovementFilters = {
  direction: MovementDirectionFilter;
  /** "YYYY-MM-DD" as typed into a date input, an Argentine calendar day. */
  dateFrom: string;
  dateTo: string;
  /** `""` is no filter. Keeps movements carrying this food on any line. */
  foodId: string;
};

const EMPTY_FILTERS: MovementFilters = {
  direction: "",
  dateFrom: "",
  dateTo: "",
  foodId: "",
};

export function useEstablishmentMovementsHistory(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();

  const [movements, setMovements] = useState<FoodMovementListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const [filters, setFilters] = useState<MovementFilters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] =
    useState<MovementFilters>(EMPTY_FILTERS);

  // Typing into a date input fires per keystroke; debouncing keeps a half-typed
  // year from reaching the API. The page reset rides along with it.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [filters]);

  const fetchMovements = useCallback(
    async (currentPage: number, currentFilters: MovementFilters) => {
      // An inverted range is a 400 (`/errors/invalid-date-range`) the user can
      // fix without a round trip, so it never leaves the browser.
      if (
        currentFilters.dateFrom &&
        currentFilters.dateTo &&
        currentFilters.dateFrom > currentFilters.dateTo
      ) {
        setMovements([]);
        setTotal(0);
        setTotalPages(1);
        setStatus(null);
        setError(ESTABLISHMENT_MOVEMENTS_PAGE.invalidRange);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setStatus(null);
      try {
        const data = await listEstablishmentFoodMovementsAction(
          makeAuthorizedRequest,
          establishmentId,
          {
            page: currentPage,
            page_size: PAGE_SIZE,
            direction: currentFilters.direction || undefined,
            // The inputs name Argentine calendar days; `occurred_at` is a UTC
            // instant. Widening here keeps a movement shown as 03/09 inside a
            // 03/09 filter instead of dropping out of it after 21:00 local.
            occurred_from: argentineDayStartUtc(currentFilters.dateFrom),
            occurred_to: argentineDayEndUtc(currentFilters.dateTo),
            food_id: currentFilters.foodId || undefined,
          },
        );
        setMovements(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        if (err instanceof ApiError) setStatus(err.status);
        setMovements([]);
        setError(
          getErrorMessage(err, {
            fallback: ESTABLISHMENT_MOVEMENTS_PAGE.loadError,
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, establishmentId],
  );

  useEffect(() => {
    fetchMovements(page, debouncedFilters);
  }, [fetchMovements, page, debouncedFilters]);

  const updateFilter = <K extends keyof MovementFilters>(
    key: K,
    value: MovementFilters[K],
  ) => setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const hasActiveFilters =
    debouncedFilters.direction !== "" ||
    debouncedFilters.dateFrom !== "" ||
    debouncedFilters.dateTo !== "" ||
    debouncedFilters.foodId !== "";

  return {
    movements,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    notFound: status === StatusCodes.NOT_FOUND,
    forbidden: status === StatusCodes.FORBIDDEN,
  };
}
