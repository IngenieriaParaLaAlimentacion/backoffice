"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Loader2, X } from "lucide-react";
import { useUserDetail } from "@/hooks/useUserDetail";
import { ROLE_LABELS } from "@/types/user";

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
  const { user, isLoading, error } = useUserDetail(userId);

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
                Perfil
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Información del usuario
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
          ) : user ? (
            <div className="flex flex-col gap-4">
              <ProfileField
                label="Nombre"
                value={
                  user.last_name
                    ? `${user.name} ${user.last_name}`
                    : user.name
                }
              />
              <ProfileField label="Email" value={user.email} />
              {user.role && (
                <ProfileField
                  label="Rol"
                  value={ROLE_LABELS[user.role] ?? user.role}
                />
              )}
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
