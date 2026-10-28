"use client";

import { EstablishmentResponse } from "@/types/establishment";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { PENDING_REQUESTS_PAGE } from "@/constants/users";

export type Decision = "approve" | "reject";

export type Decisions = Record<string, Decision>;

type EstablishmentDecisionListProps = {
  establishments: EstablishmentResponse[];
  decisions: Decisions;
  onDecide: (establishmentId: string, decision: Decision) => void;
  disabled?: boolean;
};

/**
 * Per-establishment accept/reject toggles. Clicking the active decision again
 * clears it, leaving that establishment pending. Shared by the user-request
 * and establishment-access review panels.
 */
export default function EstablishmentDecisionList({
  establishments,
  decisions,
  onDecide,
  disabled,
}: EstablishmentDecisionListProps) {
  return (
    <div className="flex flex-col gap-3">
      {establishments.map((est) => {
        const decision = decisions[est.id];
        return (
          <div
            key={est.id}
            role="group"
            aria-label={est.name}
            className="rounded-lg border border-border p-3 flex flex-col gap-2"
          >
            <div className="flex min-w-0 flex-col">
              <span className="font-medium text-sm break-words">
                {est.name}
              </span>
              <span className="text-muted-foreground text-xs break-words">
                {est.formatted_address}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={decision === "approve" ? "default" : "outline"}
                className="flex-1"
                disabled={disabled}
                onClick={() => onDecide(est.id, "approve")}
              >
                <Check size={14} />
                {PENDING_REQUESTS_PAGE.accept}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`flex-1 ${
                  decision === "reject"
                    ? "bg-destructive/10 text-destructive border-destructive/50 hover:bg-destructive/20 hover:text-destructive"
                    : "text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                }`}
                disabled={disabled}
                onClick={() => onDecide(est.id, "reject")}
              >
                <X size={14} />
                {PENDING_REQUESTS_PAGE.reject}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Clicking the active decision again clears it, leaving the request pending. */
export function toggleDecision(
  decisions: Decisions,
  establishmentId: string,
  decision: Decision,
): Decisions {
  if (decisions[establishmentId] === decision) {
    const next = { ...decisions };
    delete next[establishmentId];
    return next;
  }
  return { ...decisions, [establishmentId]: decision };
}

/** Splits the decided establishments into the two ids lists the API takes. */
export function splitDecisions(
  establishments: EstablishmentResponse[],
  decisions: Decisions,
) {
  const approvedIds = establishments
    .filter((est) => decisions[est.id] === "approve")
    .map((est) => est.id);
  const rejectedIds = establishments
    .filter((est) => decisions[est.id] === "reject")
    .map((est) => est.id);

  return { approvedIds, rejectedIds };
}
