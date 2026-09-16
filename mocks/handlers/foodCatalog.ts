import { http, HttpResponse } from "msw";
import { FOOD_CATEGORIES_ENDPOINT } from "@/constants/api";
import { MOCK_FOOD_CATEGORIES } from "@/mocks/fixtures/foodCatalog";

export function makeListFoodCategoriesHandler() {
  return http.get(FOOD_CATEGORIES_ENDPOINT, () =>
    HttpResponse.json(MOCK_FOOD_CATEGORIES),
  );
}
