"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getEstablishmentFoodMovementAction } from "@/services/establishment.service";
import { FoodMovementDetail } from "@/types/establishment";
import { Separator } from "@/components/ui/separator";
import {
  ESTABLISHMENT_MOVEMENTS_PAGE as COPY,
  FOOD_OUTFLOW_CATEGORY_LABELS,
  MOVEMENT_DIRECTION_LABELS,
  MOVEMENT_SOURCE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/constants/establishments";
import { formatQuantity, formatTimestamp } from "@/lib/format";
import { ERROR_TYPES } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

type MovementDetailPanelProps = {
  establishmentId: string;
  /** `null` closes the panel. */
  movementId: string | null;
  onClose: () => void;
};

/**
 * The lines live only here: the listing row is deliberately line-free so it
 * pages cheaply, which makes opening the panel a second request.
 */
export default function MovementDetailPanel({
  establishmentId,
  movementId,
  onClose,
}: MovementDetailPanelProps) {
  const { makeAuthorizedRequest } = useAuth();

  const [detail, setDetail] = useState<FoodMovementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movementId) return;
    let cancelled = false;

    setDetail(null);
    setError(null);
    setIsLoading(true);

    getEstablishmentFoodMovementAction(
      makeAuthorizedRequest,
      establishmentId,
      movementId,
    )
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          getErrorMessage(err, {
            // A movement of another comedor answers 404 on purpose, so that
            // this reads "no existe" and never leaks "exists, but not yours".
            overrides: {
              [ERROR_TYPES.FOOD_MOVEMENT_NOT_FOUND]: COPY.detail.notFound,
            },
            fallback: COPY.detail.loadError,
          }),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movementId, makeAuthorizedRequest, establishmentId]);

  return (
    <Dialog.Root
      open={!!movementId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={cn("fixed inset-0 z-40", OVERLAY_CLASS)} />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <Dialog.Title className="text-xl font-bold tracking-tight">
              {detail
                ? `${MOVEMENT_DIRECTION_LABELS[detail.direction]} — ${formatTimestamp(detail.occurred_at)}`
                : COPY.detail.title}
            </Dialog.Title>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <Separator />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={28}
              />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label={COPY.detail.direction}
                  value={MOVEMENT_DIRECTION_LABELS[detail.direction]}
                />
                <DetailField
                  label={COPY.detail.date}
                  value={formatTimestamp(detail.occurred_at)}
                />
                <DetailField
                  label={COPY.detail.responsible}
                  value={`${detail.responsible.name} ${detail.responsible.last_name}`}
                />
                {detail.direction === "in" && (
                  <DetailField
                    label={COPY.detail.source}
                    value={MOVEMENT_SOURCE_LABELS[detail.source]}
                  />
                )}
                {detail.direction === "out" && detail.category && (
                  <DetailField
                    label={COPY.detail.category}
                    value={FOOD_OUTFLOW_CATEGORY_LABELS[detail.category]}
                  />
                )}
              </div>
              {detail.comments && (
                <DetailField
                  label={COPY.detail.comments}
                  value={
                    <span className="block whitespace-pre-line break-words">
                      {detail.comments}
                    </span>
                  }
                />
              )}

              <Separator />

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  {COPY.detail.linesTitle}
                </span>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-left">
                        <th className="px-3 py-2 font-medium">
                          {COPY.detail.food}
                        </th>
                        <th className="px-3 py-2 font-medium">
                          {COPY.detail.quantity}
                        </th>
                        <th className="px-3 py-2 font-medium">
                          {COPY.detail.unit}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Keyed by index, not by food id: two lines of the same
                          food in one movement are legal (that's why
                          `food_count` can be lower than `items.length`). */}
                      {detail.items.map((item, index) => (
                        <tr key={`${item.food.id}-${index}`}>
                          <td className="px-3 py-2 font-medium">
                            {item.food.name}
                          </td>
                          <td className="px-3 py-2">
                            {formatQuantity(item.quantity)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {STOCK_UNIT_LABELS[item.unit] ?? item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
