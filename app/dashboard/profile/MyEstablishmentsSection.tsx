"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import {
  getMyEstablishmentsAction,
  requestEstablishmentAccessAction,
  subscribeEstablishmentsAction,
  unsubscribeEstablishmentsAction,
  withdrawEstablishmentAccessAction,
} from "@/services/user.service";
import { ProfileEstablishment } from "@/types/user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Plus } from "lucide-react";
import { OVERLAY_CLASS, PILL_CLASS, TONE_PILL_CLASS } from "@/constants/theme";
import {
  RELATION_STATUS_LABELS,
  RELATION_STATUS_TONE,
} from "@/constants/establishments";
import { MY_ESTABLISHMENTS } from "@/constants/users";
import { formatEstablishmentLocation } from "@/lib/format";
import { getErrorMessage } from "@/lib/errorMessages";
import { cn } from "@/lib/utils";
import EstablishmentSearchDialog from "./EstablishmentSearchDialog";

// Analysts link an establishment by requesting access, admins by subscribing;
// everything else in the section is the same for both.
const MODES = {
  request: {
    add: requestEstablishmentAccessAction,
    remove: withdrawEstablishmentAccessAction,
    // Only a live request can be withdrawn.
    canRemove: (est: ProfileEstablishment) =>
      est.status === "pending" || est.status === "approved",
    showProposeLink: true,
    copy: MY_ESTABLISHMENTS.request,
  },
  subscribe: {
    add: subscribeEstablishmentsAction,
    remove: unsubscribeEstablishmentsAction,
    canRemove: () => true,
    showProposeLink: false,
    copy: MY_ESTABLISHMENTS.subscribe,
  },
} as const;

export default function MyEstablishmentsSection() {
  const { makeAuthorizedRequest } = useAuth();
  const { can } = useSession();

  const config = can("establishments.requestAccess")
    ? MODES.request
    : can("establishments.subscribe")
      ? MODES.subscribe
      : null;

  const [establishments, setEstablishments] = useState<ProfileEstablishment[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProfileEstablishment | null>(
    null,
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const fetchEstablishments = useCallback(async () => {
    try {
      setError(null);
      setEstablishments(await getMyEstablishmentsAction(makeAuthorizedRequest));
    } catch (err) {
      setError(getErrorMessage(err, { fallback: MY_ESTABLISHMENTS.loadError }));
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const handleAdd = async (establishmentId: string) => {
    if (!config) return;
    await config.add(makeAuthorizedRequest, [establishmentId]);
    setIsSearchOpen(false);
    await fetchEstablishments();
  };

  const handleConfirmRemove = async () => {
    if (!config || !removeTarget) return;
    setIsRemoving(true);
    setRemoveError(null);
    try {
      await config.remove(makeAuthorizedRequest, [removeTarget.id]);
      setRemoveTarget(null);
      await fetchEstablishments();
    } catch (err) {
      setRemoveError(
        getErrorMessage(err, { fallback: config.copy.removeError }),
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const closeRemoveDialog = () => {
    setRemoveTarget(null);
    setRemoveError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-semibold text-foreground">
            {MY_ESTABLISHMENTS.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {MY_ESTABLISHMENTS.subtitle}
          </p>
        </div>

        {config && (
          <Button
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="self-start sm:self-auto gap-1.5"
          >
            <Plus size={16} />
            {config.copy.add}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : establishments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Building2 size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {MY_ESTABLISHMENTS.empty}
          </p>
          {config?.showProposeLink && (
            <Link
              href="/dashboard/establishments/propose"
              className="text-sm font-medium text-primary hover:underline"
            >
              {MY_ESTABLISHMENTS.proposeLink}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {establishments.map((est) => (
            <div
              key={est.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Building2 size={18} className="text-muted-foreground" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      {est.name}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {formatEstablishmentLocation(est)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0",
                      PILL_CLASS,
                      TONE_PILL_CLASS[RELATION_STATUS_TONE[est.status]],
                    )}
                  >
                    {RELATION_STATUS_LABELS[est.status]}
                  </span>
                </div>

                {config?.canRemove(est) && (
                  <div className="-mb-1 -ml-2 flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setRemoveTarget(est)}
                    >
                      {config.copy.remove}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {config && isSearchOpen && (
        <EstablishmentSearchDialog
          onClose={() => setIsSearchOpen(false)}
          title={config.copy.searchTitle}
          actionLabel={config.copy.add}
          actionError={config.copy.addError}
          showProposeLink={config.showProposeLink}
          onPick={handleAdd}
        />
      )}

      {config && (
        <Dialog.Root
          open={Boolean(removeTarget)}
          onOpenChange={(open) => !open && closeRemoveDialog()}
        >
          <Dialog.Portal>
            <Dialog.Backdrop
              className={cn("fixed inset-0 z-40", OVERLAY_CLASS)}
            />
            <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-background p-6 shadow-xl flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Dialog.Title className="text-lg font-semibold text-foreground">
                  {config.copy.removeTitle}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {removeTarget &&
                    config.copy.removeDescription(removeTarget.name)}
                </Dialog.Description>
              </div>

              {removeError && (
                <Alert variant="destructive">
                  <AlertDescription>{removeError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRemoving}
                  onClick={closeRemoveDialog}
                >
                  {MY_ESTABLISHMENTS.cancel}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isRemoving}
                  onClick={handleConfirmRemove}
                >
                  {isRemoving && (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  )}
                  {config.copy.confirmRemove}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
