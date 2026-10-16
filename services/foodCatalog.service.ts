import { AuthDispatcher } from "@/context/AuthContext";
import { FOOD_CATEGORIES_ENDPOINT, FOODS_ENDPOINT } from "@/constants/api";
import { FoodCategory, PaginatedFoodsResponse } from "@/types/foodCatalog";
import { toApiError } from "@/lib/apiError";

/** Not paginated — the catalog is ~26 categories, small enough to list whole. */
export const listFoodCategoriesAction = async (dispatcher: AuthDispatcher) => {
  const res = await dispatcher<undefined, FoodCategory[]>(
    FOOD_CATEGORIES_ENDPOINT,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as FoodCategory[];
};

export type FoodFilters = {
  search?: string;
  category_id?: string;
};

type ListFoodsParams = FoodFilters & {
  page?: number;
  page_size?: number;
};

const foodFilterQuery = (filters?: FoodFilters) => {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.category_id) query.set("category_id", filters.category_id);
  return query;
};

/**
 * Paginated, unlike the categories: the catalog holds hundreds of foods, which
 * is why the picker searches instead of listing everything.
 *
 * `sort_order` is left out on purpose — the backend already defaults to
 * `name_asc`, which is the order a name search wants.
 */
export const listFoodsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListFoodsParams,
) => {
  const query = foodFilterQuery(params);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const path = query.size
    ? `${FOODS_ENDPOINT}?${query.toString()}`
    : FOODS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedFoodsResponse>(path);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedFoodsResponse;
};
