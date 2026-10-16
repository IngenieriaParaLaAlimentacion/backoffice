"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CircleCheck, Loader2, X } from "lucide-react";
import { useUserDetail } from "@/hooks/useUserDetail";
import { useRevokeAccess } from "@/hooks/useRevokeAccess";
import { useSession } from "@/context/SessionContext";
import { ROLE_LABELS, STATUS_LABELS } from "@/types/user";
import { USER_DETAIL_PANEL } from "@/constants/users";
import { AdminUserDetail } from "@/types/admin";
import RevokeAccessMenu from "@/components/listings/RevokeAccessMenu";
import { OVERLAY_CLASS, TONE_BANNER_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { assignableRoles } from "@/lib/permissions";
import ChangeRoleDialog from "./ChangeRoleDialog";

type UserDetailPanelProps = {
  userId: string | null;
  onClose: () => void;
  /** Called after an action moved the user out of (or within) the list. */
  onUserChanged?: () => void;
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
  onUserChanged,
}: UserDetailPanelProps) {
  const { user, isLoading, error, refetch, replace } = useUserDetail(userId);
  const { can, profile, role: viewerRole } = useSession();
  const canRevokeAccess = can("users.revokeAccess");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Nobody changes their own role, whatever the matrix says, and only an
  // active user's role can change (pending invitations and unvalidated field
  // workers get a 400).
  const roleOptions =
    user && user.id !== profile?.id && user.status === "active"
      ? assignableRoles(viewerRole, user.role)
      : [];

  const { revokingId, actionError, revoke, reset } = useRevokeAccess(
    {
      confirmDialog: USER_DETAIL_PANEL.removeAccessConfirmDialog,
      conflict: USER_DETAIL_PANEL.removeAccessConflict,
      genericError: USER_DETAIL_PANEL.removeAccessError,
    },
    refetch,
  );

  useEffect(() => {
    reset();
    setSuccessMessage(null);
  }, [userId, reset]);

  const handleRoleChanged = (updated: AdminUserDetail) => {
    replace(updated);
    setSuccessMessage(
      USER_DETAIL_PANEL.changeRole.success(
        updated.role ? ROLE_LABELS[updated.role] : "",
      ),
    );
    onUserChanged?.();
  };

  const handleRemoveAccess = (establishmentId: string) => {
    if (!user) return;
    revoke(establishmentId, user.id, establishmentId);
  };

  return (
    <Dialog.Root
      open={!!userId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={cn("fixed inset-0 z-40", OVERLAY_CLASS)} />
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

          {successMessage && (
            <div
              role="status"
              className={`mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${TONE_BANNER_CLASS.success}`}
            >
              <CircleCheck size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1">{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
                aria-label={USER_DETAIL_PANEL.changeRole.closeAria}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {actionError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
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
                <div className="flex items-end justify-between gap-2">
                  <ProfileField
                    label={USER_DETAIL_PANEL.fields.role}
                    value={ROLE_LABELS[user.role] ?? user.role}
                  />
                  {roleOptions.length > 0 && (
                    <ChangeRoleDialog
                      userId={user.id}
                      currentRole={user.role}
                      options={roleOptions}
                      onChanged={handleRoleChanged}
                    />
                  )}
                </div>
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
              {user.establishments && user.establishments.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {USER_DETAIL_PANEL.fields.establishments}
                  </span>
                  <div className="flex flex-col gap-2">
                    {user.establishments.map((est) => (
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
                        {canRevokeAccess && (
                          <RevokeAccessMenu
                            label={USER_DETAIL_PANEL.removeAccess}
                            menuLabel={USER_DETAIL_PANEL.actionsMenuLabel}
                            isSubmitting={revokingId === est.id}
                            onRevoke={() => handleRemoveAccess(est.id)}
                          />
                        )}
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
