import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listFoodCategoriesAction } from "@/services/foodCatalog.service";
import { FoodCategory } from "@/types/foodCatalog";

/**
 * The category filter degrades to "no filter" on failure instead of blocking
 * the stock listing — the catalog is a nice-to-have for filtering, not a gate.
 */
export function useFoodCategories() {
  const { makeAuthorizedRequest } = useAuth();
  const [categories, setCategories] = useState<FoodCategory[]>([]);

  useEffect(() => {
    listFoodCategoriesAction(makeAuthorizedRequest)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [makeAuthorizedRequest]);

  return categories;
}
