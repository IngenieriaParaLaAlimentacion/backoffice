import { http, HttpResponse } from "msw";
import { FOOD_CATEGORIES_ENDPOINT, FOODS_ENDPOINT } from "@/constants/api";
import { MOCK_FOOD_CATEGORIES, MOCK_FOODS } from "@/mocks/fixtures/foodCatalog";

export function makeListFoodCategoriesHandler() {
  return http.get(FOOD_CATEGORIES_ENDPOINT, () =>
    HttpResponse.json(MOCK_FOOD_CATEGORIES),
  );
}

/** Accent- and case-insensitive, like a backend `unaccent`/`ilike` search. */
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Filters for real on `search` and `category_id`: the picker's whole point is
 * that the category narrows the search, and a handler that ignored either
 * would let that break silently.
 */
export function makeListFoodsHandler() {
  return http.get(FOODS_ENDPOINT, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const categoryId = url.searchParams.get("category_id");
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);

    const matches = MOCK_FOODS.filter(
      (food) => !categoryId || food.category.id === categoryId,
    ).filter(
      (food) => !search || normalize(food.name).includes(normalize(search)),
    );

    const items = matches.slice(0, pageSize);

    return HttpResponse.json({
      items,
      total: matches.length,
      page: 1,
      page_size: pageSize,
      total_pages: Math.max(1, Math.ceil(matches.length / pageSize)),
    });
  });
}
