"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BlockMode, useBlockUser } from "@/hooks/useBlockUser";
import { USER_DETAIL_PANEL } from "@/constants/users";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { AdminUserDetail } from "@/types/admin";

type BlockUserDialogProps = {
  userId: string;
  userName: string;
  mode: BlockMode;
  onChanged: (user: AdminUserDetail) => void;
};

/**
 * Asks for confirmation before blocking or unblocking a user. Errors stay
 * inside the dialog so the admin can retry or cancel.
 */
export default function BlockUserDialog({
  userId,
  userName,
  mode,
  onChanged,
}: BlockUserDialogProps) {
  const copy = USER_DETAIL_PANEL[mode];
  const [open, setOpen] = useState(false);
  const { isSubmitting, error, submit, reset } = useBlockUser(mode);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  async function handleConfirm() {
    const updated = await submit(userId);
    if (!updated) return;
    handleOpenChange(false);
    onChanged(updated);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger render={<Button size="sm" variant="outline" />}>
        {copy.button}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn("fixed inset-0 z-[60]", OVERLAY_CLASS)}
        />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm rounded-xl border bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold">
                {copy.title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {copy.description(userName)}
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
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Dialog.Close render={<Button type="button" variant="ghost" />}>
                {copy.cancel}
              </Dialog.Close>
              <Button
                type="button"
                variant={mode === "block" ? "destructive" : "default"}
                disabled={isSubmitting}
                onClick={handleConfirm}
              >
                {isSubmitting ? copy.confirming : copy.confirm}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
