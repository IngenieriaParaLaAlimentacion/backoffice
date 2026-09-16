import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentStockAction } from "@/services/establishment.service";
import { FoodStockItem, FoodStockSortOrder } from "@/types/establishment";
import {
  ESTABLISHMENT_STOCK_PAGE,
  PAGE_SIZE,
} from "@/constants/establishments";
import { getErrorMessage } from "@/lib/errorMessages";

const DEFAULT_SORT_ORDER: FoodStockSortOrder = "name_asc";

export function useEstablishmentStock(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();

  const [stock, setStock] = useState<FoodStockItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [sortOrder, setSortOrderState] =
    useState<FoodStockSortOrder>(DEFAULT_SORT_ORDER);

  const fetchStock = useCallback(
    async (
      currentPage: number,
      currentCategoryId: string,
      currentSortOrder: FoodStockSortOrder,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listEstablishmentStockAction(
          makeAuthorizedRequest,
          establishmentId,
          {
            page: currentPage,
            page_size: PAGE_SIZE,
            category_id: currentCategoryId || undefined,
            // Always on: this screen is about what's actually available, not
            // a full inventory audit — zero-quantity rows are never shown.
            only_available: true,
            sort_order: currentSortOrder,
          },
        );
        setStock(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          getErrorMessage(err, {
            fallback: ESTABLISHMENT_STOCK_PAGE.loadError,
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, establishmentId],
  );

  useEffect(() => {
    fetchStock(page, categoryId, sortOrder);
  }, [fetchStock, page, categoryId, sortOrder]);

  const changeCategoryId = (next: string) => {
    setCategoryId(next);
    setPage(1);
  };

  const changeSortOrder = (next: FoodStockSortOrder) => {
    setSortOrderState(next);
    setPage(1);
  };

  return {
    stock,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    categoryId,
    setCategoryId: changeCategoryId,
    sortOrder,
    setSortOrder: changeSortOrder,
  };
}
