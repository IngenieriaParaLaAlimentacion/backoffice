import { useEffect, useRef, useState } from "react";
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

const sameFilters = (a: MovementFilters, b: MovementFilters) =>
  a.direction === b.direction &&
  a.dateFrom === b.dateFrom &&
  a.dateTo === b.dateTo &&
  a.foodId === b.foodId;

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

  // Read through a ref so settling the debounce can compare against the last
  // applied value without putting `debouncedFilters` in the effect's deps.
  const appliedFilters = useRef(EMPTY_FILTERS);

  // Typing into a date input fires per keystroke; debouncing keeps a half-typed
  // year from reaching the API.
  //
  // The page reset deliberately does NOT ride along here. Fired 300ms after
  // the fact, it would silently undo a page the reader clicked in the
  // meantime; resetting when the filter is edited instead makes it immediate,
  // visible, and impossible to race against the paginator.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (sameFilters(filters, appliedFilters.current)) return;
      appliedFilters.current = filters;
      setDebouncedFilters(filters);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    // An inverted range is a 400 (`/errors/invalid-date-range`) the user can
    // fix without a round trip, so it never leaves the browser.
    if (
      debouncedFilters.dateFrom &&
      debouncedFilters.dateTo &&
      debouncedFilters.dateFrom > debouncedFilters.dateTo
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

    listEstablishmentFoodMovementsAction(
      makeAuthorizedRequest,
      establishmentId,
      {
        page,
        page_size: PAGE_SIZE,
        direction: debouncedFilters.direction || undefined,
        // The inputs name Argentine calendar days; `occurred_at` is a UTC
        // instant. Widening here keeps a movement shown as 03/09 inside a
        // 03/09 filter instead of dropping out of it after 21:00 local.
        occurred_from: argentineDayStartUtc(debouncedFilters.dateFrom),
        occurred_to: argentineDayEndUtc(debouncedFilters.dateTo),
        food_id: debouncedFilters.foodId || undefined,
      },
    )
      .then((data) => {
        if (cancelled) return;
        setMovements(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) setStatus(err.status);
        setMovements([]);
        setError(
          getErrorMessage(err, {
            fallback: ESTABLISHMENT_MOVEMENTS_PAGE.loadError,
          }),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [makeAuthorizedRequest, establishmentId, page, debouncedFilters]);

  // Narrowing the results invalidates whatever page the reader was on, so both
  // entry points reset it at the moment of the edit.
  const updateFilter = <K extends keyof MovementFilters>(
    key: K,
    value: MovementFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

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
