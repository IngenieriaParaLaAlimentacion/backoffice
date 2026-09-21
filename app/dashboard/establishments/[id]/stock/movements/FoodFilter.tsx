"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside";
import { useFoodCategories } from "@/hooks/useFoodCategories";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import { FoodListItem } from "@/types/foodCatalog";
import { Input } from "@/components/ui/input";
import {
  ESTABLISHMENT_MOVEMENTS_PAGE as COPY,
  SELECT_CLASS,
} from "@/constants/establishments";

type FoodFilterProps = {
  selectedFood: FoodListItem | null;
  /** `null` clears the filter. */
  onSelectFood: (food: FoodListItem | null) => void;
};

/**
 * The category select and the food combobox as one unit, because they are one:
 * `GET /food-movements` takes `food_id` and **no** `category_id`, so picking a
 * category narrows what the search offers and changes nothing about the
 * listing until a food is actually chosen. Keeping both controls here is what
 * stops the page from presenting the category as a listing filter it isn't.
 */
export default function FoodFilter({
  selectedFood,
  onSelectFood,
}: FoodFilterProps) {
  const categories = useFoodCategories();

  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const containerRef = useDismissOnOutside(open, () => setOpen(false));
  const listboxId = useId();

  const { foods, isLoading, hasMore } = useFoodSearch({
    search,
    categoryId,
    enabled: open,
  });

  useEffect(() => setHighlighted(0), [foods]);

  // The list scrolls once it outgrows its max height, so arrow keys have to
  // drag the viewport along or the highlight walks off-screen. The optional
  // call is for jsdom, which doesn't implement scrollIntoView.
  useEffect(() => {
    if (!open) return;
    const food = foods[highlighted];
    if (!food) return;
    document
      .getElementById(`${listboxId}-${food.id}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [open, highlighted, foods, listboxId]);

  const select = (food: FoodListItem) => {
    onSelectFood(food);
    setSearch(food.name);
    setOpen(false);
  };

  const clear = () => {
    onSelectFood(null);
    setSearch("");
  };

  // A food from another category would stay selected but invisible in the
  // narrowed list, so switching category drops it.
  const changeCategory = (next: string) => {
    setCategoryId(next);
    if (selectedFood) clear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlighted((current) => {
        if (foods.length === 0) return 0;
        const next = e.key === "ArrowDown" ? current + 1 : current - 1;
        return (next + foods.length) % foods.length;
      });
      return;
    }
    if (e.key === "Enter" && open && foods[highlighted]) {
      e.preventDefault();
      select(foods[highlighted]);
    }
  };

  return (
    // `w-full` claims a row of its own inside the filter panel: the heading
    // is what keeps the category from reading as a peer of Dirección, and it
    // only works if the pair sits together on one line. No box of its own —
    // the panel already draws one.
    <div className="flex w-full flex-col gap-2">
      <span className="text-xs font-medium">{COPY.foodSearchTitle}</span>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="food-category"
          >
            {COPY.foodCategoryLabel}
          </label>
          <select
            id="food-category"
            value={categoryId}
            onChange={(e) => changeCategory(e.target.value)}
            className={`${SELECT_CLASS} w-full sm:w-52`}
          >
            <option value="">{COPY.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="food-search"
          >
            {COPY.foodLabel}
          </label>
          <div ref={containerRef} className="relative w-full sm:w-64">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={16}
            />
            <Input
              id="food-search"
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                open && foods[highlighted]
                  ? `${listboxId}-${foods[highlighted].id}`
                  : undefined
              }
              value={search}
              placeholder={COPY.foodPlaceholder}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
                // Typing past a selection means the filter no longer matches
                // what the box says, so the selection goes with it.
                if (selectedFood) onSelectFood(null);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className={`pl-8 ${selectedFood ? "pr-8" : ""}`}
            />

            {selectedFood && (
              <button
                type="button"
                onClick={clear}
                aria-label={COPY.clearFood}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}

            {open && (
              <div
                id={listboxId}
                role="listbox"
                // Around four options tall: enough to see there is a list and
                // that it scrolls, without the dropdown covering the rows the
                // person is filtering.
                className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2
                      className="animate-spin text-muted-foreground"
                      size={16}
                    />
                  </div>
                ) : foods.length === 0 ? (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    {COPY.noFoodResults}
                  </p>
                ) : (
                  <>
                    {foods.map((food, index) => (
                      <button
                        key={food.id}
                        id={`${listboxId}-${food.id}`}
                        type="button"
                        role="option"
                        aria-selected={selectedFood?.id === food.id}
                        onMouseEnter={() => setHighlighted(index)}
                        onClick={() => select(food)}
                        className={`flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                          index === highlighted ? "bg-muted/50" : ""
                        }`}
                      >
                        {food.name}
                        {/* Names repeat across categories; the SARA code means
                            nothing to a user, the category does. */}
                        <span className="text-xs text-muted-foreground">
                          {food.category.name}
                        </span>
                      </button>
                    ))}
                    {hasMore && (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        {COPY.moreFoodResults}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
