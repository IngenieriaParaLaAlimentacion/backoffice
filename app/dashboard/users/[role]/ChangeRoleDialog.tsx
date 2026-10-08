"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChangeUserRole } from "@/hooks/useChangeUserRole";
import { USER_DETAIL_PANEL } from "@/constants/users";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { AdminUserDetail } from "@/types/admin";
import { ROLE_LABELS, UserRole } from "@/types/user";

const COPY = USER_DETAIL_PANEL.changeRole;

type ChangeRoleDialogProps = {
  userId: string;
  currentRole: UserRole;
  /** From `assignableRoles`; the caller doesn't render the dialog when empty. */
  options: UserRole[];
  onChanged: (user: AdminUserDetail) => void;
};

/**
 * Changes only the user's role — it asks for nothing else. Errors stay
 * inside the dialog so the admin can retry or pick another role.
 */
export default function ChangeRoleDialog({
  userId,
  currentRole,
  options,
  onChanged,
}: ChangeRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserRole | null>(null);
  const { isSubmitting, error, changeRole, reset } = useChangeUserRole();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelected(null);
      reset();
    }
  }

  async function handleConfirm() {
    if (!selected) return;
    const updated = await changeRole(userId, selected);
    if (!updated) return;
    handleOpenChange(false);
    onChanged(updated);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger render={<Button size="sm" variant="outline" />}>
        {COPY.button}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn("fixed inset-0 z-[60]", OVERLAY_CLASS)}
        />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm rounded-xl border bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold">
                {COPY.title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {COPY.description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                {COPY.currentRole}
              </span>
              <span className="text-sm">{ROLE_LABELS[currentRole]}</span>
            </div>

            <fieldset disabled={isSubmitting} className="flex flex-col gap-2">
              <legend className="mb-2 text-xs text-muted-foreground">
                {COPY.newRole}
              </legend>
              {options.map((role) => (
                <label
                  key={role}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selected === role}
                    onChange={() => setSelected(role)}
                    className="accent-primary"
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </fieldset>

            <Alert>
              <AlertDescription>{COPY.warning}</AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Dialog.Close render={<Button type="button" variant="ghost" />}>
                {COPY.cancel}
              </Dialog.Close>
              <Button
                type="button"
                disabled={!selected || isSubmitting}
                onClick={handleConfirm}
              >
                {isSubmitting ? COPY.confirming : COPY.confirm}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
