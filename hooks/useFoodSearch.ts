import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listFoodsAction } from "@/services/foodCatalog.service";
import { FoodListItem } from "@/types/foodCatalog";
import { FILTER_DEBOUNCE_MS } from "@/constants/establishments";

/** A dropdown's worth of suggestions, not a listing — the rest is refined by
 *  typing, which is what `hasMore` tells the user to do. */
const FOOD_SEARCH_PAGE_SIZE = 20;

/**
 * Searches the food catalog for the picker, scoped to a category when one is
 * chosen. Degrades to an empty list on failure instead of surfacing an error:
 * the food filter is a convenience, and it must never take the listing it
 * filters down with it.
 */
export function useFoodSearch({
  search,
  categoryId,
  enabled,
}: {
  search: string;
  categoryId: string;
  /** The dropdown is open. Closed, the hook queries nothing. */
  enabled: boolean;
}) {
  const { makeAuthorizedRequest } = useAuth();

  const [foods, setFoods] = useState<FoodListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  /** The query whose results are already in state; `null` until one lands. */
  const loadedQuery = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Reopening the dropdown without touching the text would otherwise refetch
    // what is already on screen, costing a round trip and a spinner for the
    // same list. Only set on success, so a failed search is retried.
    const query = `${categoryId}|${search}`;
    if (query === loadedQuery.current) return;

    let cancelled = false;
    setIsLoading(true);

    const timeout = setTimeout(() => {
      listFoodsAction(makeAuthorizedRequest, {
        search: search || undefined,
        category_id: categoryId || undefined,
        page_size: FOOD_SEARCH_PAGE_SIZE,
      })
        .then((data) => {
          if (cancelled) return;
          loadedQuery.current = query;
          setFoods(data.items);
          setTotal(data.total);
        })
        .catch(() => {
          if (cancelled) return;
          setFoods([]);
          setTotal(0);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, FILTER_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [makeAuthorizedRequest, search, categoryId, enabled]);

  return { foods, isLoading, hasMore: total > foods.length };
}
