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

  const reload = useCallback(() => {
    generation.current += 1;
    pageInFlight.current = false;
    setStock([]);
    setStockPage(0);
    setStockPages(1);
    setVersion((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!open || direction !== "in") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      listFoodsAction(makeAuthorizedRequest, {
        search: search || undefined,
        page_size: 20,
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
            page_size: 100,
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
    pageInFlight.current = false;
    setStock([]);
    setStockPage(0);
    setStockPages(1);
    void loadStockPage(1, requestGeneration);
    return () => {
      generation.current += 1;
    };
  }, [open, direction, version, loadStockPage]);

  const loadMoreStock = useCallback(() => {
    if (!pageInFlight.current && stockPage > 0 && stockPage < stockPages)
      void loadStockPage(stockPage + 1, generation.current);
  }, [stockPage, stockPages, loadStockPage]);

  return {
    foods,
    allStock: stock,
    loading,
    error,
    hasMoreStock: stockPage > 0 && stockPage < stockPages,
    stockLoaded: stockPage > 0,
    loadMoreStock,
    reload,
  };
}
