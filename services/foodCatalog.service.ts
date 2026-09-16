import { AuthDispatcher } from "@/context/AuthContext";
import { FOOD_CATEGORIES_ENDPOINT } from "@/constants/api";
import { FoodCategory } from "@/types/foodCatalog";
import { toApiError } from "@/lib/apiError";

/** Not paginated — the catalog is ~26 categories, small enough to list whole. */
export const listFoodCategoriesAction = async (dispatcher: AuthDispatcher) => {
  const res = await dispatcher<undefined, FoodCategory[]>(
    FOOD_CATEGORIES_ENDPOINT,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as FoodCategory[];
};
