import { FoodCategory, FoodListItem } from "@/types/foodCatalog";

// A handful of the ~26 real SARA 2 categories — enough to exercise the filter,
// not a full catalog replica.
export const MOCK_FOOD_CATEGORIES: FoodCategory[] = [
  { id: "c1000000-0000-0000-0000-000000000001", name: "Cereales y derivados" },
  { id: "c1000000-0000-0000-0000-000000000002", name: "Verduras y frutas" },
  { id: "c1000000-0000-0000-0000-000000000003", name: "Lácteos" },
  { id: "c1000000-0000-0000-0000-000000000004", name: "Carnes y huevos" },
  { id: "c1000000-0000-0000-0000-000000000005", name: "Aceites y grasas" },
];

/**
 * The three foods the stock and movement fixtures already reference, keyed by
 * the same ids so a food picked here filters those movements, plus two extras
 * that only exist to give the search something to discriminate against
 * ("Arroz" vs "Arvejas" both start with "Ar").
 */
export const MOCK_FOODS: FoodListItem[] = [
  {
    id: "d1000000-0000-0000-0000-000000000001",
    code: "01-001",
    name: "Arroz",
    base_unit: "kilogramos",
    category: MOCK_FOOD_CATEGORIES[0],
  },
  {
    id: "d1000000-0000-0000-0000-000000000002",
    code: "03-001",
    name: "Leche en polvo",
    base_unit: "kilogramos",
    category: MOCK_FOOD_CATEGORIES[2],
  },
  {
    id: "d1000000-0000-0000-0000-000000000003",
    code: "05-001",
    name: "Aceite",
    base_unit: "litros",
    category: MOCK_FOOD_CATEGORIES[4],
  },
  {
    id: "d1000000-0000-0000-0000-000000000004",
    code: "02-001",
    name: "Arvejas",
    base_unit: "kilogramos",
    category: MOCK_FOOD_CATEGORIES[1],
  },
  {
    id: "d1000000-0000-0000-0000-000000000005",
    code: "03-002",
    name: "Leche fluida",
    base_unit: "litros",
    category: MOCK_FOOD_CATEGORIES[2],
  },
];
