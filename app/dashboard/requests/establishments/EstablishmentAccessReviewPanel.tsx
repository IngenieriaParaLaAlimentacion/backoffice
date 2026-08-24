"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  approveEstablishmentsAction,
  rejectEstablishmentsAction,
} from "@/services/admin.service";
import { UserAdminView } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EstablishmentDecisionList, {
  Decision,
  Decisions,
  splitDecisions,
  toggleDecision,
} from "../EstablishmentDecisionList";
import { Check, Loader2, X } from "lucide-react";
import {
  ESTABLISHMENT_ACCESS_REQUESTS_PAGE,
  PENDING_REQUESTS_PAGE,
} from "@/constants/users";

type EstablishmentAccessReviewPanelProps = {
  user: UserAdminView | null;
  onClose: () => void;
  /** `remainingCount` is how many establishments were left undecided. */
  onApplied: (userId: string, remainingCount: number) => void;
};

/**
 * Resolves the establishment accesses still pending for an already-active
 * field worker. Unlike the user-request panel this never touches the account:
 * it only approves/rejects establishments.
 */
export default function EstablishmentAccessReviewPanel({
  user,
  onClose,
  onApplied,
}: EstablishmentAccessReviewPanelProps) {
  const { makeAuthorizedRequest } = useAuth();

  const [decisions, setDecisions] = useState<Decisions>({});
  const [isApplying, setIsApplying] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  // First click arms the action, a second one submits it.
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDecisions({});
    setPanelError(null);
    setIsConfirming(false);
  }, [user]);

  const setDecision = (establishmentId: string, decision: Decision) => {
    setDecisions((prev) => toggleDecision(prev, establishmentId, decision));
  };

  const undecidedCount = useMemo(() => {
    if (!user) return 0;
    return user.establishments.filter((est) => !decisions[est.id]).length;
  }, [user, decisions]);

  const hasDecisions = !!user && undecidedCount < user.establishments.length;

  const onApply = async () => {
    if (!user) return;

    const { approvedIds, rejectedIds } = splitDecisions(
      user.establishments,
      decisions,
    );

    setIsApplying(true);
    setPanelError(null);
    try {
      // Both endpoints require a non-empty list, so each call is conditional.
      if (approvedIds.length > 0) {
        await approveEstablishmentsAction(
          user.id,
          approvedIds,
          makeAuthorizedRequest,
        );
      }
      if (rejectedIds.length > 0) {
        await rejectEstablishmentsAction(
          user.id,
          rejectedIds,
          makeAuthorizedRequest,
        );
      }
      onApplied(user.id, undecidedCount);
    } catch (err) {
      setPanelError(
        err instanceof Error
          ? err.message
          : ESTABLISHMENT_ACCESS_REQUESTS_PAGE.applyError,
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyClick = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    onApply();
  };

  return (
    <Dialog.Root
      open={!!user}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="text-xl font-bold tracking-tight break-words">
                {user
                  ? `${user.name} ${user.last_name}`
                  : PENDING_REQUESTS_PAGE.defaultDialogTitle}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground text-sm break-all">
                {user?.email}
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <Separator />

          <p className="text-muted-foreground text-sm">
            {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.establishmentsIntro}
          </p>

          {panelError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {panelError}
            </div>
          )}

          {user && (
            <>
              <EstablishmentDecisionList
                establishments={user.establishments}
                decisions={decisions}
                onDecide={setDecision}
                disabled={isApplying}
              />

              <Separator />

              {undecidedCount > 0 && (
                <p className="text-muted-foreground text-xs">
                  {PENDING_REQUESTS_PAGE.pendingSummary(undecidedCount)}
                </p>
              )}

              {isConfirming && (
                <p className="text-sm text-muted-foreground">
                  {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.applyConfirmationMessage}
                </p>
              )}

              <Button
                type="button"
                disabled={!hasDecisions || isApplying}
                onClick={handleApplyClick}
              >
                {isApplying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {isConfirming
                  ? ESTABLISHMENT_ACCESS_REQUESTS_PAGE.applyConfirm
                  : ESTABLISHMENT_ACCESS_REQUESTS_PAGE.apply}
              </Button>

              {isConfirming && (
                <Button
                  type="button"
                  variant="outline"
                  className="hover:bg-input"
                  disabled={isApplying}
                  onClick={() => setIsConfirming(false)}
                >
                  {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.cancel}
                </Button>
              )}
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
