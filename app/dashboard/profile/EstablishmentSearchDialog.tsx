"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentsAction } from "@/services/establishment.service";
import { EstablishmentResponse } from "@/types/establishment";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Loader2, Search, X } from "lucide-react";
import { OVERLAY_CLASS } from "@/constants/theme";
import { MY_ESTABLISHMENTS } from "@/constants/users";
import { formatEstablishmentLocation } from "@/lib/format";
import { getErrorMessage } from "@/lib/errorMessages";
import { cn } from "@/lib/utils";

/** Mounted only while open, so every opening starts with an empty search. */
type EstablishmentSearchDialogProps = {
  onClose: () => void;
  title: string;
  actionLabel: string;
  actionError: string;
  showProposeLink: boolean;
  /** Links the picked establishment; throwing keeps the dialog open with the error. */
  onPick: (establishmentId: string) => Promise<void>;
};

export default function EstablishmentSearchDialog({
  onClose,
  title,
  actionLabel,
  actionError,
  showProposeLink,
  onPick,
}: EstablishmentSearchDialogProps) {
  const { makeAuthorizedRequest } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EstablishmentResponse[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    try {
      const response = await listEstablishmentsAction(makeAuthorizedRequest, {
        search: query.trim() || undefined,
        available: true,
      });
      setResults(response.items ?? []);
    } catch (err) {
      setError(
        getErrorMessage(err, { fallback: MY_ESTABLISHMENTS.search.error }),
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handlePick = async (id: string) => {
    setPickingId(id);
    setError(null);
    try {
      await onPick(id);
    } catch (err) {
      setError(getErrorMessage(err, { fallback: actionError }));
    } finally {
      setPickingId(null);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={cn("fixed inset-0 z-40", OVERLAY_CLASS)} />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg rounded-xl border bg-background p-6 shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {MY_ESTABLISHMENTS.search.description}
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={MY_ESTABLISHMENTS.search.placeholder}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={isSearching} className="gap-1.5">
              {isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {MY_ESTABLISHMENTS.search.button}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
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
            ) : results === null ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
                <Search size={20} className="text-muted-foreground/60" />
                <p className="text-sm">{MY_ESTABLISHMENTS.search.hint}</p>
              </div>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {MY_ESTABLISHMENTS.search.noResults}
              </p>
            ) : (
              results.map((est) => (
                <div
                  key={est.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {est.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {formatEstablishmentLocation(est)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={Boolean(pickingId)}
                    onClick={() => handlePick(est.id)}
                  >
                    {pickingId === est.id && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {actionLabel}
                  </Button>
                </div>
              ))
            )}
          </div>

          {showProposeLink && (
            <div className="flex items-center border-t border-border pt-3 text-sm">
              <Link
                href="/dashboard/establishments/propose"
                onClick={onClose}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <ExternalLink size={14} />
                {MY_ESTABLISHMENTS.proposeLink}
              </Link>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
