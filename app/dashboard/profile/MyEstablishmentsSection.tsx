"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import {
  getMyEstablishmentsAction,
  requestEstablishmentAccessAction,
  searchCatalogEstablishmentsAction,
  subscribeEstablishmentsAction,
  unsubscribeEstablishmentsAction,
  withdrawEstablishmentAccessAction,
} from "@/services/user.service";
import { ProfileEstablishment } from "@/types/user";
import { EstablishmentResponse } from "@/types/establishment";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  OVERLAY_CLASS,
  PILL_CLASS,
  TONE_PILL_CLASS,
  Tone,
} from "@/constants/theme";
import { MY_ESTABLISHMENTS } from "@/constants/users";
import { getErrorMessage } from "@/lib/errorMessages";
import { cn } from "@/lib/utils";

const STATUS_TONES: Record<string, Tone> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  withdrawn: "neutral",
  revoked: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  approved: MY_ESTABLISHMENTS.status.approved,
  pending: MY_ESTABLISHMENTS.status.pending,
  rejected: MY_ESTABLISHMENTS.status.rejected,
  withdrawn: MY_ESTABLISHMENTS.status.withdrawn,
  revoked: MY_ESTABLISHMENTS.status.revoked,
};

type MyEstablishmentsSectionProps = {
  initialEstablishments?: ProfileEstablishment[];
  onUpdate?: () => void;
};

export default function MyEstablishmentsSection({
  initialEstablishments,
  onUpdate,
}: MyEstablishmentsSectionProps) {
  const { makeAuthorizedRequest } = useAuth();
  const { can } = useSession();

  const canRequestAccess = can("establishments.requestAccess");
  const canSubscribe = can("establishments.subscribe");

  const [establishments, setEstablishments] = useState<ProfileEstablishment[]>(
    initialEstablishments ?? [],
  );
  const [isLoading, setIsLoading] = useState(!initialEstablishments);
  const [error, setError] = useState<string | null>(null);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EstablishmentResponse[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Confirmation dialogs
  const [withdrawTarget, setWithdrawTarget] =
    useState<ProfileEstablishment | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const [unsubscribeTarget, setUnsubscribeTarget] =
    useState<ProfileEstablishment | null>(null);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState<string | null>(null);

  const fetchEstablishments = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyEstablishmentsAction(makeAuthorizedRequest);
      setEstablishments(data);
    } catch (err) {
      setError(getErrorMessage(err, { fallback: MY_ESTABLISHMENTS.loadError }));
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  // Handle Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const response = await searchCatalogEstablishmentsAction(
        makeAuthorizedRequest,
        searchQuery,
      );
      setSearchResults(response.items ?? []);
    } catch (err) {
      setSearchError(
        getErrorMessage(err, { fallback: MY_ESTABLISHMENTS.errors.search }),
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSearchError(null);
  };

  // Handle Request Access (Analyst)
  const handleRequestAccess = async (establishmentId: string) => {
    setSubmittingId(establishmentId);
    setSearchError(null);
    try {
      await requestEstablishmentAccessAction(makeAuthorizedRequest, [
        establishmentId,
      ]);
      await fetchEstablishments();
      onUpdate?.();
      setIsSearchOpen(false);
    } catch (err) {
      setSearchError(
        getErrorMessage(err, {
          fallback: MY_ESTABLISHMENTS.errors.requestAccess,
        }),
      );
    } finally {
      setSubmittingId(null);
    }
  };

  // Handle Subscribe (Admin)
  const handleSubscribe = async (establishmentId: string) => {
    setSubmittingId(establishmentId);
    setSearchError(null);
    try {
      await subscribeEstablishmentsAction(makeAuthorizedRequest, [
        establishmentId,
      ]);
      await fetchEstablishments();
      onUpdate?.();
      setIsSearchOpen(false);
    } catch (err) {
      setSearchError(
        getErrorMessage(err, {
          fallback: MY_ESTABLISHMENTS.errors.subscribe,
        }),
      );
    } finally {
      setSubmittingId(null);
    }
  };

  // Handle Withdraw Access (Analyst)
  const handleConfirmWithdraw = async () => {
    if (!withdrawTarget) return;
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      await withdrawEstablishmentAccessAction(makeAuthorizedRequest, [
        withdrawTarget.id,
      ]);
      setWithdrawTarget(null);
      await fetchEstablishments();
      onUpdate?.();
    } catch (err) {
      setWithdrawError(
        getErrorMessage(err, { fallback: MY_ESTABLISHMENTS.errors.withdraw }),
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle Unsubscribe (Admin)
  const handleConfirmUnsubscribe = async () => {
    if (!unsubscribeTarget) return;
    setIsUnsubscribing(true);
    setUnsubscribeError(null);
    try {
      await unsubscribeEstablishmentsAction(makeAuthorizedRequest, [
        unsubscribeTarget.id,
      ]);
      setUnsubscribeTarget(null);
      await fetchEstablishments();
      onUpdate?.();
    } catch (err) {
      setUnsubscribeError(
        getErrorMessage(err, {
          fallback: MY_ESTABLISHMENTS.errors.unsubscribe,
        }),
      );
    } finally {
      setIsUnsubscribing(false);
    }
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

        {(canRequestAccess || canSubscribe) && (
          <Button
            size="sm"
            onClick={handleOpenSearch}
            className="self-start sm:self-auto gap-1.5"
          >
            <Plus size={16} />
            {canRequestAccess
              ? MY_ESTABLISHMENTS.actions.requestAccess
              : MY_ESTABLISHMENTS.actions.subscribe}
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
          {canRequestAccess && (
            <Link
              href="/dashboard/establishments/propose"
              className="text-sm font-medium text-primary hover:underline"
            >
              {MY_ESTABLISHMENTS.dialogs.proposeLink}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {establishments.map((est) => {
            const statusKey = est.status.toLowerCase();
            const tone = STATUS_TONES[statusKey] ?? "neutral";
            const statusLabel = STATUS_LABELS[statusKey] ?? est.status;
            const location =
              est.formatted_address ||
              [est.city, est.province].filter(Boolean).join(", ") ||
              est.address ||
              "-";

            const canWithdrawThis =
              canRequestAccess &&
              (statusKey === "pending" || statusKey === "approved");
            const canUnsubscribeThis = canSubscribe;

            return (
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
                        {location}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0",
                        PILL_CLASS,
                        TONE_PILL_CLASS[tone],
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {(canWithdrawThis || canUnsubscribeThis) && (
                    <div className="-mb-1 -ml-2 flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (canWithdrawThis) {
                            setWithdrawError(null);
                            setWithdrawTarget(est);
                          } else {
                            setUnsubscribeError(null);
                            setUnsubscribeTarget(est);
                          }
                        }}
                      >
                        {canWithdrawThis
                          ? MY_ESTABLISHMENTS.actions.withdraw
                          : MY_ESTABLISHMENTS.actions.unsubscribe}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search & Request/Subscribe Dialog */}
      <Dialog.Root open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn("fixed inset-0 z-40", OVERLAY_CLASS)}
          />
          <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg rounded-xl border bg-background p-6 shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Dialog.Title className="text-lg font-semibold text-foreground">
                  {canRequestAccess
                    ? MY_ESTABLISHMENTS.dialogs.searchTitleRequest
                    : MY_ESTABLISHMENTS.dialogs.searchTitleSubscribe}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {MY_ESTABLISHMENTS.dialogs.searchDescription}
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={<button type="button" />}
                className="text-muted-foreground hover:text-foreground mt-0.5"
              >
                <X size={18} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={MY_ESTABLISHMENTS.dialogs.searchPlaceholder}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" disabled={isSearching} className="gap-1.5">
                {isSearching ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                {MY_ESTABLISHMENTS.dialogs.searchButton}
              </Button>
            </form>

            {searchError && (
              <Alert variant="destructive">
                <AlertDescription>{searchError}</AlertDescription>
              </Alert>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-[140px] max-h-[340px]">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    className="animate-spin text-muted-foreground"
                    size={24}
                  />
                </div>
              ) : !hasSearched ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
                  <Search size={20} className="text-muted-foreground/60" />
                  <p className="text-sm">
                    {MY_ESTABLISHMENTS.dialogs.searchHint}
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {MY_ESTABLISHMENTS.dialogs.noResults}
                  </p>
                </div>
              ) : (
                searchResults.map((est) => {
                  const location =
                    est.formatted_address ||
                    [est.city, est.province].filter(Boolean).join(", ") ||
                    "-";
                  const isActing = submittingId === est.id;

                  return (
                    <div
                      key={est.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {est.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {location}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        disabled={Boolean(submittingId)}
                        onClick={() =>
                          canRequestAccess
                            ? handleRequestAccess(est.id)
                            : handleSubscribe(est.id)
                        }
                        variant="outline"
                        className="shrink-0"
                      >
                        {isActing && (
                          <Loader2 size={12} className="animate-spin" />
                        )}
                        {canRequestAccess
                          ? MY_ESTABLISHMENTS.actions.requestAccess
                          : MY_ESTABLISHMENTS.actions.subscribe}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            {canRequestAccess && (
              <div className="flex items-center border-t border-border pt-3 text-sm">
                <Link
                  href="/dashboard/establishments/propose"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  {MY_ESTABLISHMENTS.dialogs.proposeLink}
                </Link>
              </div>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Withdraw Access Confirmation Dialog */}
      <Dialog.Root
        open={Boolean(withdrawTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setWithdrawTarget(null);
            setWithdrawError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn("fixed inset-0 z-40", OVERLAY_CLASS)}
          />
          <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-background p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {MY_ESTABLISHMENTS.dialogs.withdrawTitle}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {withdrawTarget &&
                  MY_ESTABLISHMENTS.dialogs.withdrawDescription(
                    withdrawTarget.name,
                  )}
              </Dialog.Description>
            </div>

            {withdrawError && (
              <Alert variant="destructive">
                <AlertDescription>{withdrawError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isWithdrawing}
                onClick={() => setWithdrawTarget(null)}
              >
                {MY_ESTABLISHMENTS.actions.cancel}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isWithdrawing}
                onClick={handleConfirmWithdraw}
              >
                {isWithdrawing && (
                  <Loader2 size={14} className="animate-spin mr-1" />
                )}
                {MY_ESTABLISHMENTS.actions.confirmWithdraw}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Unsubscribe Confirmation Dialog */}
      <Dialog.Root
        open={Boolean(unsubscribeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setUnsubscribeTarget(null);
            setUnsubscribeError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn("fixed inset-0 z-40", OVERLAY_CLASS)}
          />
          <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-background p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {MY_ESTABLISHMENTS.dialogs.unsubscribeTitle}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {unsubscribeTarget &&
                  MY_ESTABLISHMENTS.dialogs.unsubscribeDescription(
                    unsubscribeTarget.name,
                  )}
              </Dialog.Description>
            </div>

            {unsubscribeError && (
              <Alert variant="destructive">
                <AlertDescription>{unsubscribeError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isUnsubscribing}
                onClick={() => setUnsubscribeTarget(null)}
              >
                {MY_ESTABLISHMENTS.actions.cancel}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isUnsubscribing}
                onClick={handleConfirmUnsubscribe}
              >
                {isUnsubscribing && (
                  <Loader2 size={14} className="animate-spin mr-1" />
                )}
                {MY_ESTABLISHMENTS.actions.confirmUnsubscribe}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
