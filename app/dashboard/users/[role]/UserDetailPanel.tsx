"use client";

import { useEffect, useState } from "react";
import { StatusCodes } from "http-status-codes";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUserDetail } from "@/hooks/useUserDetail";
import { revokeEstablishmentsAction } from "@/services/admin.service";
import { ApiError } from "@/lib/apiError";
import { ROLE_LABELS, STATUS_LABELS } from "@/types/user";
import { USER_DETAIL_PANEL } from "@/constants/users";
import RevokeAccessMenu from "@/components/listings/RevokeAccessMenu";

type UserDetailPanelProps = {
  userId: string | null;
  onClose: () => void;
};

function ProfileField({
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

export default function UserDetailPanel({
  userId,
  onClose,
}: UserDetailPanelProps) {
  const { user, isLoading, error, refetch } = useUserDetail(userId);
  const { makeAuthorizedRequest } = useAuth();

  // Confirmed via window.confirm, same as the establishment-detail view.
  // Revoked rows are removed from view on success rather than refetched,
  // matching how the rest of the app updates these lists after an action.
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRevokingId(null);
    setActionError(null);
    setRemovedIds(new Set());
  }, [userId]);

  const handleRemoveAccess = async (establishmentId: string) => {
    if (!user) return;
    if (!window.confirm(USER_DETAIL_PANEL.removeAccessConfirmDialog)) return;

    setRevokingId(establishmentId);
    setActionError(null);
    try {
      await revokeEstablishmentsAction(
        user.id,
        [establishmentId],
        makeAuthorizedRequest,
      );
      setRemovedIds((prev) => new Set(prev).add(establishmentId));
    } catch (err) {
      if (err instanceof ApiError && err.status === StatusCodes.CONFLICT) {
        setActionError(USER_DETAIL_PANEL.removeAccessConflict);
        refetch();
      } else {
        setActionError(
          err instanceof Error
            ? err.message
            : USER_DETAIL_PANEL.removeAccessError,
        );
      }
    } finally {
      setRevokingId(null);
    }
  };

  const visibleEstablishments = (user?.establishments ?? []).filter(
    (est) => !removedIds.has(est.id),
  );

  return (
    <Dialog.Root
      open={!!userId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold">
                {USER_DETAIL_PANEL.title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {USER_DETAIL_PANEL.description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {actionError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">
              {actionError}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={28}
              />
            </div>
          ) : user ? (
            <div className="flex flex-col gap-4">
              {/* --- Profile Fields --- */}
              <ProfileField
                label={USER_DETAIL_PANEL.fields.name}
                value={
                  user.last_name ? `${user.name} ${user.last_name}` : user.name
                }
              />
              <ProfileField
                label={USER_DETAIL_PANEL.fields.email}
                value={user.email}
              />
              {user.role && (
                <ProfileField
                  label={USER_DETAIL_PANEL.fields.role}
                  value={ROLE_LABELS[user.role] ?? user.role}
                />
              )}
              {user.status && (
                <ProfileField
                  label={USER_DETAIL_PANEL.fields.status}
                  value={STATUS_LABELS[user.status] ?? user.status}
                />
              )}
              {user.contact_phone && (
                <ProfileField
                  label={USER_DETAIL_PANEL.fields.contactPhone}
                  value={user.contact_phone}
                />
              )}
              {user.locality && (
                <ProfileField
                  label={USER_DETAIL_PANEL.fields.locality}
                  value={user.locality}
                />
              )}
              {user.description && (
                <ProfileField
                  label={USER_DETAIL_PANEL.fields.description}
                  value={user.description}
                />
              )}
              {visibleEstablishments.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {USER_DETAIL_PANEL.fields.establishments}
                  </span>
                  <div className="flex flex-col gap-2">
                    {visibleEstablishments.map((est) => (
                      <div
                        key={est.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {est.name}
                          </span>
                          {est.formatted_address && (
                            <span className="block text-xs text-muted-foreground">
                              {est.formatted_address}
                            </span>
                          )}
                        </div>
                        <RevokeAccessMenu
                          label={USER_DETAIL_PANEL.removeAccess}
                          menuLabel={USER_DETAIL_PANEL.actionsMenuLabel}
                          isSubmitting={revokingId === est.id}
                          onRevoke={() => handleRemoveAccess(est.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
