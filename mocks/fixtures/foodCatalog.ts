import { FoodCategory } from "@/types/foodCatalog";

// A handful of the ~26 real SARA 2 categories — enough to exercise the filter,
// not a full catalog replica.
export const MOCK_FOOD_CATEGORIES: FoodCategory[] = [
  { id: "c1000000-0000-0000-0000-000000000001", name: "Cereales y derivados" },
  { id: "c1000000-0000-0000-0000-000000000002", name: "Verduras y frutas" },
  { id: "c1000000-0000-0000-0000-000000000003", name: "Lácteos" },
  { id: "c1000000-0000-0000-0000-000000000004", name: "Carnes y huevos" },
  { id: "c1000000-0000-0000-0000-000000000005", name: "Aceites y grasas" },
];
