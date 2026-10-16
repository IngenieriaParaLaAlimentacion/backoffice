"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FOOD_MOVEMENT_FORM as COPY } from "@/constants/establishments";
import { FoodMovementDirection, FoodStockItem } from "@/types/establishment";
import { FoodListItem } from "@/types/foodCatalog";
import {
  MovementFood,
  selectedFoodId,
  selectedName,
} from "@/schemas/foodMovement.schema";
import { formatQuantity } from "@/lib/format";
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside";

export default function MovementFoodPicker({
  direction,
  value,
  foods,
  stock,
  excludedIds,
  loading,
  error,
  hasMoreStock,
  onLoadMore,
  onChange,
  onSearch,
  disabled,
}: {
  direction: FoodMovementDirection;
  value: MovementFood | null;
  foods: FoodListItem[];
  stock: FoodStockItem[];
  excludedIds: Set<string>;
  loading: boolean;
  error: string | null;
  hasMoreStock: boolean;
  onLoadMore: () => void;
  onChange: (value: MovementFood | null) => void;
  onSearch: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const containerRef = useDismissOnOutside(open, () => setOpen(false));
  useEffect(() => {
    if (value) setQuery(selectedName(value));
  }, [value]);
  const needle = query.toLocaleLowerCase("es-AR");
  const options: MovementFood[] = (
    direction === "in"
      ? foods
      : stock.filter((item) =>
          item.food.name.toLocaleLowerCase("es-AR").includes(needle),
        )
  ).filter((item) => !excludedIds.has(selectedFoodId(item)));
  const choose = (item: MovementFood) => {
    onChange(item);
    setQuery(selectedName(item));
    setOpen(false);
  };
  return (
    <div ref={containerRef} className="relative min-w-0">
      <label htmlFor={`${id}-input`} className="text-sm">
        {COPY.food}
      </label>
      <Input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={
          open && options[active]
            ? `${id}-${selectedFoodId(options[active])}`
            : undefined
        }
        value={query}
        disabled={disabled}
        onFocus={() => {
          onSearch(query);
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          onSearch(event.target.value);
          if (value) onChange(null);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            // Dismisses the list only; the dialog keeps the draft.
            event.stopPropagation();
            setOpen(false);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((current) => Math.min(current + 1, options.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(0, current - 1));
          }
          if (event.key === "Enter" && open) {
            event.preventDefault();
            if (!loading && !error && options[active]) choose(options[active]);
          }
        }}
      />
      {open && (
        <div
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
        >
          {loading && <p className="p-2 text-sm">{COPY.loadingFoods}</p>}
          {error && (
            <p role="alert" className="p-2 text-sm">
              {error}
            </p>
          )}
          {!loading &&
            !error &&
            options.map((item, index) => (
              <button
                id={`${id}-${selectedFoodId(item)}`}
                type="button"
                role="option"
                aria-selected={
                  value ? selectedFoodId(value) === selectedFoodId(item) : false
                }
                key={selectedFoodId(item)}
                className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
              >
                {selectedName(item)}{" "}
                {"food" in item
                  ? `· ${formatQuantity(item.quantity)} ${item.unit}`
                  : `· ${item.category.name}`}
              </button>
            ))}
          {!loading && !error && options.length === 0 && (
            <p className="p-2 text-sm">{COPY.noFoods}</p>
          )}
          {direction === "out" && hasMoreStock && (
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={onLoadMore}
            >
              {COPY.loadMore}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
