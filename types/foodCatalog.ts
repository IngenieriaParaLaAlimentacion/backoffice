import { FoodStockUnit } from "@/types/establishment";

export type FoodCategory = {
  id: string;
  name: string;
};

/**
 * `base_unit` is the unit a food's stock is persisted in — the very same union
 * stock rows and movement lines use, so it is imported rather than restated
 * here. The resulting cycle between the two type modules is inert: both export
 * types only and are erased at compile time. Don't "fix" it by duplicating.
 */
export type FoodListItem = {
  id: string;
  /** SARA 2 code. Not shown to users — the name is what they recognise. */
  code: string;
  name: string;
  base_unit: FoodStockUnit;
  category: FoodCategory;
};

export type PaginatedFoodsResponse = {
  items: FoodListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type FoodSortOrder = "name_asc" | "name_desc";
