import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FILTER_DEBOUNCE_MS,
  FOOD_MOVEMENT_FORM as COPY,
} from "@/constants/establishments";
import { listFoodsAction } from "@/services/foodCatalog.service";
import { listEstablishmentStockAction } from "@/services/establishment.service";
import { FoodListItem } from "@/types/foodCatalog";
import { FoodMovementDirection, FoodStockItem } from "@/types/establishment";
import { getErrorMessage } from "@/lib/errorMessages";

const FOOD_SEARCH_PAGE_SIZE = 20;
// The stock endpoint caps a page at 100 rows.
const STOCK_PAGE_SIZE = 100;

export function useMovementFoodOptions(
  establishmentId: string,
  direction: FoodMovementDirection,
  open: boolean,
  search: string,
) {
  const { makeAuthorizedRequest } = useAuth();
  const [foods, setFoods] = useState<FoodListItem[]>([]);
  const [stock, setStock] = useState<FoodStockItem[]>([]);
  const [stockPage, setStockPage] = useState(0);
  const [stockPages, setStockPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const generation = useRef(0);
  const pageInFlight = useRef(false);

  const resetStock = useCallback(() => {
    pageInFlight.current = false;
    setStock([]);
    setStockPage(0);
    setStockPages(1);
  }, []);

  const reload = useCallback(() => {
    generation.current += 1;
    resetStock();
    setVersion((n) => n + 1);
  }, [resetStock]);

  useEffect(() => {
    if (!open || direction !== "in") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      listFoodsAction(makeAuthorizedRequest, {
        search: search || undefined,
        page_size: FOOD_SEARCH_PAGE_SIZE,
      })
        .then((result) => {
          if (!cancelled) setFoods(result.items);
        })
        .catch((reason) => {
          if (!cancelled) {
            setFoods([]);
            setError(getErrorMessage(reason, { fallback: COPY.foodLoadError }));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, FILTER_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, direction, search, makeAuthorizedRequest]);

  const loadStockPage = useCallback(
    async (page: number, requestGeneration: number) => {
      if (pageInFlight.current) return;
      pageInFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const result = await listEstablishmentStockAction(
          makeAuthorizedRequest,
          establishmentId,
          {
            only_available: true,
            page,
            page_size: STOCK_PAGE_SIZE,
            sort_order: "name_asc",
          },
        );
        if (requestGeneration !== generation.current) return;
        setStock((previous) =>
          page === 1 ? result.items : [...previous, ...result.items],
        );
        setStockPage(page);
        setStockPages(result.total_pages);
      } catch (reason) {
        if (requestGeneration === generation.current)
          setError(getErrorMessage(reason, { fallback: COPY.stockLoadError }));
      } finally {
        if (requestGeneration === generation.current) {
          pageInFlight.current = false;
          setLoading(false);
        }
      }
    },
    [makeAuthorizedRequest, establishmentId],
  );

  useEffect(() => {
    if (!open || direction !== "out") return;
    const requestGeneration = ++generation.current;
    resetStock();
    void loadStockPage(1, requestGeneration);
    return () => {
      generation.current += 1;
    };
  }, [open, direction, version, loadStockPage, resetStock]);

  const hasMoreStock = stockPage > 0 && stockPage < stockPages;
  const loadMoreStock = useCallback(() => {
    if (!pageInFlight.current && hasMoreStock)
      void loadStockPage(stockPage + 1, generation.current);
  }, [hasMoreStock, stockPage, loadStockPage]);

  return {
    foods,
    stock,
    loading,
    error,
    hasMoreStock,
    stockLoaded: stockPage > 0,
    loadMoreStock,
    reload,
  };
}
