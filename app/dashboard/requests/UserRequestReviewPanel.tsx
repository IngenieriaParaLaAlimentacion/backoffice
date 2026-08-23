"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  approveFieldWorkerAction,
  rejectEstablishmentsAction,
  rejectFieldWorkerAction,
} from "@/services/admin.service";
import { UserAdminView } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EstablishmentDecisionList, {
  Decision,
  Decisions,
  splitDecisions,
  toggleDecision,
} from "./EstablishmentDecisionList";
import { Check, Loader2, X } from "lucide-react";
import { PENDING_REQUESTS_PAGE } from "@/constants/users";

type PendingAction = "approve" | "reject" | null;

type UserRequestReviewPanelProps = {
  user: UserAdminView | null;
  onClose: () => void;
  onResolved: (userId: string) => void;
};

/**
 * Review panel for a single field-worker request: activates the account
 * (optionally resolving some establishments along the way) or rejects the
 * worker outright. Both actions need a second click to confirm.
 */
export default function UserRequestReviewPanel({
  user,
  onClose,
  onResolved,
}: UserRequestReviewPanelProps) {
  const { makeAuthorizedRequest } = useAuth();

  const [decisions, setDecisions] = useState<Decisions>({});
  const [isApplying, setIsApplying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  // First click arms the action (shows its confirmation message); a second
  // click on the same button submits it.
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isAccountActivated, setIsAccountActivated] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDecisions({});
    setPanelError(null);
    setPendingAction(null);
    setIsAccountActivated(false);
  }, [user]);

  const setDecision = (establishmentId: string, decision: Decision) => {
    setDecisions((prev) => toggleDecision(prev, establishmentId, decision));
  };

  const hasEstablishments = !!user?.establishments.length;
  const isBusy = isApplying || isRejecting;

  const undecidedCount = useMemo(() => {
    if (!user) return 0;
    return user.establishments.filter((est) => !decisions[est.id]).length;
  }, [user, decisions]);

  const onApprove = async () => {
    if (!user) return;

    const { approvedIds, rejectedIds } = splitDecisions(
      user.establishments,
      decisions,
    );

    setIsApplying(true);
    setPanelError(null);
    // Local mirror of the state: the catch below needs the value this attempt
    // reached, not the one captured when the closure was created.
    let activated = isAccountActivated;
    try {
      if (!activated) {
        // Activates the account; undecided establishments stay pending.
        await approveFieldWorkerAction(
          user.id,
          approvedIds,
          makeAuthorizedRequest,
        );
        activated = true;
        setIsAccountActivated(true);
      }
      // The endpoint requires a non-empty list.
      if (rejectedIds.length > 0) {
        await rejectEstablishmentsAction(
          user.id,
          rejectedIds,
          makeAuthorizedRequest,
        );
      }
      onResolved(user.id);
    } catch (err) {
      const detail = err instanceof Error ? err.message : null;
      setPanelError(
        activated
          ? `${PENDING_REQUESTS_PAGE.partialApplyError}${detail ? ` (${detail})` : ""}`
          : (detail ?? PENDING_REQUESTS_PAGE.applyError),
      );
    } finally {
      setIsApplying(false);
    }
  };

  const onReject = async () => {
    if (!user) return;

    setIsRejecting(true);
    setPanelError(null);
    try {
      // Rejects every requested establishment and leaves the account inactive,
      // so the per-establishment decisions don't apply here.
      await rejectFieldWorkerAction(user.id, makeAuthorizedRequest);
      onResolved(user.id);
    } catch (err) {
      setPanelError(
        err instanceof Error ? err.message : PENDING_REQUESTS_PAGE.rejectError,
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleApproveClick = () => {
    if (pendingAction !== "approve") {
      setPendingAction("approve");
      return;
    }
    onApprove();
  };

  const handleRejectClick = () => {
    if (pendingAction !== "reject") {
      setPendingAction("reject");
      return;
    }
    onReject();
  };

  return (
    <Dialog.Root
      open={!!user}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        if (isAccountActivated && user) onResolved(user.id);
        else onClose();
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
              {user && !user.is_email_verified && (
                <span className="inline-block self-start rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600">
                  {PENDING_REQUESTS_PAGE.emailNotVerified}
                </span>
              )}
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
            {hasEstablishments
              ? PENDING_REQUESTS_PAGE.establishmentsIntro
              : PENDING_REQUESTS_PAGE.noEstablishmentsRequested}
          </p>

          {panelError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {panelError}
            </div>
          )}

          {user && (
            <>
              {hasEstablishments && (
                <>
                  <EstablishmentDecisionList
                    establishments={user.establishments}
                    decisions={decisions}
                    onDecide={setDecision}
                    disabled={isBusy}
                  />

                  <Separator />

                  {undecidedCount > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {PENDING_REQUESTS_PAGE.pendingSummary(undecidedCount)}
                    </p>
                  )}
                </>
              )}

              {pendingAction === "approve" && (
                <p className="text-sm text-muted-foreground">
                  {PENDING_REQUESTS_PAGE.acceptConfirmationMessage}
                </p>
              )}

              {pendingAction === "reject" && (
                <p className="text-sm text-muted-foreground">
                  {PENDING_REQUESTS_PAGE.rejectConfirmationMessage}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={isBusy}
                  onClick={handleApproveClick}
                >
                  {isApplying ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {pendingAction === "approve"
                    ? PENDING_REQUESTS_PAGE.acceptConfirm
                    : PENDING_REQUESTS_PAGE.acceptRequest}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                  disabled={isBusy || isAccountActivated}
                  onClick={handleRejectClick}
                >
                  {isRejecting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <X size={16} />
                  )}
                  {pendingAction === "reject"
                    ? PENDING_REQUESTS_PAGE.rejectConfirm
                    : PENDING_REQUESTS_PAGE.rejectRequest}
                </Button>
              </div>

              {pendingAction && (
                <Button
                  type="button"
                  variant="outline"
                  className="hover:bg-input"
                  disabled={isBusy}
                  onClick={() => setPendingAction(null)}
                >
                  {PENDING_REQUESTS_PAGE.cancel}
                </Button>
              )}
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
