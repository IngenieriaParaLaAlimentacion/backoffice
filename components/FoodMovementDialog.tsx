"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OVERLAY_CLASS } from "@/constants/theme";
import { FOOD_MOVEMENT_FORM as COPY } from "@/constants/establishments";
import {
  foodMovementSchema,
  FoodMovementInput,
  selectedFoodId,
  selectedUnit,
  validateMovement,
  OUTFLOW_EXCEEDS_STOCK,
} from "@/schemas/foodMovement.schema";
import { useMovementFoodOptions } from "@/hooks/useMovementFoodOptions";
import { useCreateFoodMovement } from "@/hooks/useCreateFoodMovement";
import { ApiError, ERROR_TYPES } from "@/lib/apiError";
import { argentineDayStartUtc, formatTimestampDate } from "@/lib/format";
import {
  CreatedFoodMovement,
  FoodMovementDirection,
} from "@/types/establishment";
import MovementFoodPicker from "@/components/MovementFoodPicker";
import { availableMillis, quantityMillis } from "@/lib/foodMovementQuantity";

const todayInArgentina = () =>
  formatTimestampDate(new Date().toISOString()).split("/").reverse().join("-");
const initial = (direction: FoodMovementDirection): FoodMovementInput => ({
  direction,
  date: todayInArgentina(),
  comments: "",
  lines: [{ food: null, quantity: "" }],
});

export default function FoodMovementDialog({
  establishmentId,
  open,
  onOpenChange,
  onSaved,
}: {
  establishmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (result: {
    movement: CreatedFoodMovement;
    replayed: boolean;
  }) => void;
}) {
  const [entryId, setEntryId] = useState(() => crypto.randomUUID());
  const [activeSearch, setActiveSearch] = useState("");
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const {
    control,
    register,
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FoodMovementInput>({
    resolver: zodResolver(foodMovementSchema),
    defaultValues: initial("in"),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const direction = watch("direction");
  const lines = watch("lines");
  const options = useMovementFoodOptions(
    establishmentId,
    direction,
    open,
    activeSearch,
  );
  const {
    hasMoreStock,
    loading: optionsLoading,
    error: optionsError,
    loadMoreStock,
  } = options;
  const save = useCreateFoodMovement();
  const availability = useMemo(
    () => new Map(options.allStock.map((row) => [row.food.id, row.quantity])),
    [options.allStock],
  );

  useEffect(() => {
    if (!open) return;
    setEntryId(crypto.randomUUID());
    reset(initial("in"));
    save.reset();
    setConflict(null);
    setActiveSearch("");
    setActiveLineId(null);
    // A new draft belongs to each opening, not each stock response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const unresolvedSelected =
    direction === "out" &&
    lines.some(
      (line) => line.food && !availability.has(selectedFoodId(line.food)),
    );
  useEffect(() => {
    if (
      conflict &&
      unresolvedSelected &&
      hasMoreStock &&
      !optionsLoading &&
      !optionsError
    )
      loadMoreStock();
  }, [
    conflict,
    unresolvedSelected,
    hasMoreStock,
    optionsLoading,
    optionsError,
    loadMoreStock,
  ]);

  const selectedLineState = lines
    .map(
      (line) =>
        `${line.food ? selectedFoodId(line.food) : ""}:${line.quantity}`,
    )
    .join("|");
  useEffect(() => {
    if (
      !conflict ||
      direction !== "out" ||
      !options.stockLoaded ||
      (hasMoreStock && unresolvedSelected) ||
      optionsLoading ||
      optionsError
    )
      return;
    getValues("lines").forEach((line, index) => {
      if (!line.food) return;
      const quantity = quantityMillis(line.quantity);
      const available = availableMillis(
        availability.get(selectedFoodId(line.food)) ?? "0",
      );
      const path = `lines.${index}.quantity` as const;
      if (quantity !== null && quantity > available)
        setError(path, { message: OUTFLOW_EXCEEDS_STOCK });
      else clearErrors(path);
    });
  }, [
    conflict,
    direction,
    options.stockLoaded,
    hasMoreStock,
    unresolvedSelected,
    optionsLoading,
    optionsError,
    selectedLineState,
    availability,
    getValues,
    setError,
    clearErrors,
  ]);

  const changeDirection = (next: FoodMovementDirection) => {
    setEntryId(crypto.randomUUID());
    reset(initial(next));
    save.reset();
    setConflict(null);
    setActiveSearch("");
    setActiveLineId(null);
  };

  const finish = (result: {
    movement: CreatedFoodMovement;
    replayed: boolean;
  }) => {
    onSaved(result);
    onOpenChange(false);
  };

  const submit = handleSubmit(async (value) => {
    if (save.ambiguous || options.loading || options.error) return;
    const available = new Map(availability);
    if (direction === "out" && options.stockLoaded && !options.hasMoreStock) {
      for (const line of value.lines)
        if (line.food && !available.has(selectedFoodId(line.food)))
          available.set(selectedFoodId(line.food), "0");
    }
    const problems = validateMovement(value, todayInArgentina(), available);
    if (Object.keys(problems).length) {
      for (const [path, message] of Object.entries(problems))
        setError(
          path as `lines.${number}.food` | `lines.${number}.quantity` | "date",
          { message },
        );
      return;
    }
    const body = {
      id: entryId,
      establishment_id: establishmentId,
      occurred_at:
        value.date === todayInArgentina()
          ? new Date().toISOString()
          : argentineDayStartUtc(value.date)!,
      comments: value.comments.trim() || null,
      source: "manual" as const,
      items: value.lines.map((line) => ({
        food_id: selectedFoodId(line.food!),
        quantity: line.quantity.trim(),
      })),
    };
    try {
      const saved = await save.submit(direction, body);
      if (saved) finish(saved);
    } catch (reason) {
      if (
        reason instanceof ApiError &&
        reason.type === ERROR_TYPES.INSUFFICIENT_STOCK
      ) {
        const foodId = reason.extensions.food_id;
        const selected = value.lines.find(
          (line) => line.food && selectedFoodId(line.food) === foodId,
        )?.food;
        const name =
          selected && ("food" in selected ? selected.food.name : selected.name);
        setConflict(name ? COPY.insufficient(name) : COPY.insufficientUnknown);
        options.reload();
      }
    }
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!save.saving) onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={`fixed inset-0 z-40 ${OVERLAY_CLASS}`} />
        <Dialog.Popup className="fixed inset-0 z-50 m-auto h-fit max-h-[90vh] w-[min(95vw,40rem)] overflow-y-auto rounded-lg border border-border bg-background p-5 shadow-xl">
          <Dialog.Title className="text-xl font-semibold">
            {COPY.title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            {COPY.description}
          </Dialog.Description>
          <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
            <fieldset
              disabled={save.saving || save.ambiguous}
              className="flex gap-4"
            >
              <label>
                <input
                  type="radio"
                  name="movement-direction"
                  checked={direction === "in"}
                  onChange={() => changeDirection("in")}
                />{" "}
                {COPY.intake}
              </label>
              <label>
                <input
                  type="radio"
                  name="movement-direction"
                  checked={direction === "out"}
                  onChange={() => changeDirection("out")}
                />{" "}
                {COPY.outflow}
              </label>
            </fieldset>
            <label className="text-sm">
              {COPY.date}
              <Input
                type="date"
                max={todayInArgentina()}
                disabled={save.saving || save.ambiguous}
                {...register("date")}
              />
            </label>
            {errors.date && (
              <p role="alert" className="text-sm text-destructive">
                {errors.date.message}
              </p>
            )}
            {direction === "out" &&
              options.stockLoaded &&
              !options.loading &&
              !options.error &&
              options.allStock.length === 0 &&
              !options.hasMoreStock && <p>{COPY.emptyStock}</p>}
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
              >
                <div>
                  <MovementFoodPicker
                    direction={direction}
                    value={lines[index]?.food ?? null}
                    foods={activeLineId === field.id ? options.foods : []}
                    stock={options.allStock}
                    excludedIds={
                      new Set(
                        lines
                          .filter((_, row) => row !== index)
                          .flatMap((line) =>
                            line.food ? [selectedFoodId(line.food)] : [],
                          ),
                      )
                    }
                    onSearch={(text) => {
                      setActiveLineId(field.id);
                      setActiveSearch(text);
                    }}
                    loading={options.loading}
                    error={options.error}
                    hasMoreStock={options.hasMoreStock}
                    onLoadMore={options.loadMoreStock}
                    onChange={(food) => {
                      setValue(`lines.${index}.food`, food, {
                        shouldValidate: true,
                      });
                      clearErrors(`lines.${index}.food`);
                    }}
                    disabled={save.saving || save.ambiguous}
                  />
                  {errors.lines?.[index]?.food && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.lines[index]?.food?.message}
                    </p>
                  )}
                  {direction === "out" && lines[index]?.food && (
                    <small className="text-muted-foreground">
                      {availability.get(selectedFoodId(lines[index].food!)) ??
                        (options.hasMoreStock ||
                        !options.stockLoaded ||
                        options.loading
                          ? COPY.availabilityUnknown
                          : "0")}{" "}
                      {selectedUnit(lines[index].food!)}
                    </small>
                  )}
                </div>
                <div>
                  <Input
                    aria-label={`${COPY.quantity} ${index + 1}`}
                    inputMode="decimal"
                    disabled={save.saving || save.ambiguous}
                    {...register(`lines.${index}.quantity`)}
                  />
                  <small>
                    {lines[index]?.food ? selectedUnit(lines[index].food!) : ""}
                  </small>
                  {errors.lines?.[index]?.quantity && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.lines[index]?.quantity?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={
                    fields.length === 1 || save.saving || save.ambiguous
                  }
                  onClick={() => remove(index)}
                >
                  {COPY.removeLine}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={save.saving || save.ambiguous}
              onClick={() => append({ food: null, quantity: "" })}
            >
              {COPY.addLine}
            </Button>
            {errors.lines?.message && (
              <p role="alert">{errors.lines.message}</p>
            )}
            <label className="text-sm">
              {COPY.comments}
              <textarea
                className="w-full rounded-lg border border-input bg-background p-2"
                disabled={save.saving || save.ambiguous}
                {...register("comments")}
              />
            </label>
            {errors.comments && <p role="alert">{errors.comments.message}</p>}
            {options.error && <p role="alert">{options.error}</p>}
            {conflict && <p role="alert">{conflict}</p>}
            {save.error && <p role="alert">{save.error}</p>}
            {save.ambiguous && (
              <Button
                type="button"
                onClick={async () => {
                  try {
                    const saved = await save.retryFrozen();
                    if (saved) finish(saved);
                  } catch {
                    /* The hook reports the result. */
                  }
                }}
              >
                {COPY.retrySame}
              </Button>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={save.saving}
                onClick={() => onOpenChange(false)}
              >
                {COPY.cancel}
              </Button>
              <Button
                type="submit"
                disabled={
                  save.saving ||
                  save.ambiguous ||
                  !!options.error ||
                  (direction === "out" && options.allStock.length === 0)
                }
              >
                {COPY.save}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
