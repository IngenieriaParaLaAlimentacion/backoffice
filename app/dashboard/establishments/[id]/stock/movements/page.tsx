"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEstablishmentMovementsHistory } from "@/hooks/useEstablishmentMovementsHistory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import FullScreenMessage from "@/components/FullScreenMessage";
import Pagination from "@/components/Pagination";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowChevron,
  ROW_HOVER_CLASS,
  rowStateClass,
} from "@/components/listings/RowAffordance";
import {
  ESTABLISHMENT_MOVEMENTS_PAGE as COPY,
  MOVEMENT_DIRECTION_LABELS,
  MOVEMENT_DIRECTION_OPTIONS,
  SELECT_CLASS,
} from "@/constants/establishments";
import { formatTimestamp } from "@/lib/format";
import { MovementDirectionFilter } from "@/hooks/useEstablishmentMovementsHistory";
import MovementDetailPanel from "./MovementDetailPanel";

const PANEL_HREF = "/dashboard/establishments";

/**
 * A screen of its own rather than a fourth tab of the ficha: it is the
 * chronological log, not another view of the current balance, and it is
 * reached from the "Historial de Movimientos" button in the Stock tab. That
 * is also why it lives outside the `(ficha)` route group — it deliberately
 * does not inherit the header/metrics/tab chrome.
 */
export default function EstablishmentMovementsHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    movements,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    filters,
    updateFilter,
    hasActiveFilters,
    notFound,
    forbidden,
  } = useEstablishmentMovementsHistory(id);

  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(
    null,
  );

  const stockHref = `/dashboard/establishments/${id}/stock`;
  const columns = COPY.columns;

  if (notFound) {
    return (
      <FullScreenMessage
        title={COPY.notFoundTitle}
        body={COPY.notFoundBody}
        actionHref={PANEL_HREF}
        actionLabel={COPY.backToPanel}
      />
    );
  }

  if (forbidden) {
    return (
      <FullScreenMessage
        title={COPY.forbiddenTitle}
        body={COPY.forbiddenBody}
        actionHref={PANEL_HREF}
        actionLabel={COPY.backToPanel}
      />
    );
  }

  // Nothing back with no filter on means the comedor has no movements at all,
  // which is an empty state and never an error (CA4).
  const emptyMessage = hasActiveFilters ? COPY.noResults : COPY.noMovements;

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="self-start -ml-2"
            render={<Link href={stockHref} />}
          >
            <ArrowLeft size={16} />
            {COPY.back}
          </Button>

          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{COPY.title}</h1>
            <p className="text-muted-foreground text-sm">
              {COPY.subtitle(total)}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="movement-direction"
              >
                {COPY.directionLabel}
              </label>
              <select
                id="movement-direction"
                value={filters.direction}
                onChange={(e) =>
                  updateFilter(
                    "direction",
                    e.target.value as MovementDirectionFilter,
                  )
                }
                className={`${SELECT_CLASS} w-full sm:w-56`}
              >
                {MOVEMENT_DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="movement-date-from"
              >
                {COPY.dateFrom}
              </label>
              <Input
                id="movement-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="w-full sm:w-40"
              />
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="movement-date-to"
              >
                {COPY.dateTo}
              </label>
              <Input
                id="movement-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={28}
              />
            </div>
          ) : movements.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              {!error && emptyMessage}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">{columns.date}</th>
                      <th className="px-4 py-3 font-medium">
                        {columns.direction}
                      </th>
                      <th className="px-4 py-3 font-medium">
                        {columns.responsible}
                      </th>
                      <th className="px-4 py-3 font-medium">{columns.foods}</th>
                      <ChevronHeaderCell />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {movements.map((movement) => (
                      <tr
                        key={movement.id}
                        onClick={() => setSelectedMovementId(movement.id)}
                        className={`${ROW_HOVER_CLASS} ${rowStateClass(
                          selectedMovementId === movement.id,
                        )}`}
                      >
                        {/* The instant, not just the day: this is an audit
                            log, and two movements can share a date. */}
                        <td className="px-4 py-3 font-medium">
                          {formatTimestamp(movement.occurred_at)}
                        </td>
                        <td className="px-4 py-3">
                          {MOVEMENT_DIRECTION_LABELS[movement.direction]}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {movement.responsible.name}{" "}
                          {movement.responsible.last_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {COPY.foodCount(movement.food_count)}
                        </td>
                        <ChevronCell />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 md:hidden">
                {movements.map((movement) => (
                  <button
                    key={movement.id}
                    type="button"
                    onClick={() => setSelectedMovementId(movement.id)}
                    className={`flex flex-col gap-2 rounded-lg border border-border p-3 text-left ${CARD_HOVER_CLASS} ${rowStateClass(
                      selectedMovementId === movement.id,
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">
                        {MOVEMENT_DIRECTION_LABELS[movement.direction]}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                        {formatTimestamp(movement.occurred_at)}
                        <RowChevron />
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        {movement.responsible.name}{" "}
                        {movement.responsible.last_name}
                      </span>
                      <span>{COPY.foodCount(movement.food_count)}</span>
                    </div>
                  </button>
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </Card>

      <MovementDetailPanel
        establishmentId={id}
        movementId={selectedMovementId}
        onClose={() => setSelectedMovementId(null)}
      />
    </div>
  );
}
