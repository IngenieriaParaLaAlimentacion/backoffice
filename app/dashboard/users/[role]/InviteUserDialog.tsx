"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@base-ui/react/dialog";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AppTextField from "@/components/AppTextField";
import {
  inviteAdminSchema,
  InviteAdminInput,
} from "@/schemas/inviteAdmin.schema";
import { useAuth, AuthDispatcher } from "@/context/AuthContext";
import { resendInviteAction } from "@/services/admin.service";
import { INVITE_USER_DIALOG } from "@/constants/users";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";

type InviteUserDialogProps = {
  label: string;
  inviteAction: (dispatcher: AuthDispatcher, email: string) => Promise<string>;
};

export default function InviteUserDialog({
  label,
  inviteAction,
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [invitedUserId, setInvitedUserId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const { makeAuthorizedRequest } = useAuth();

  const {
    formState: { isSubmitting, isValid },
    control,
    handleSubmit,
    reset,
  } = useForm<InviteAdminInput>({
    resolver: zodResolver(inviteAdminSchema),
    mode: "all",
    defaultValues: { email: "" },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
      setSentEmail(null);
      setInvitedUserId(null);
      setSendError(null);
    }
  }

  async function handleInvite({ email }: InviteAdminInput) {
    setSendError(null);
    try {
      const userId = await inviteAction(makeAuthorizedRequest, email);
      setSentEmail(email);
      setInvitedUserId(userId);
    } catch (err) {
      setSentEmail(email);
      setInvitedUserId(null);
      setSendError((err as Error).message);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      if (invitedUserId) {
        await resendInviteAction(makeAuthorizedRequest, invitedUserId);
      } else if (sentEmail) {
        const userId = await inviteAction(makeAuthorizedRequest, sentEmail);
        setInvitedUserId(userId);
      }
      setSendError(null);
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger render={<Button size="sm" variant="outline" />}>
        <Plus size={14} />
        {label}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={cn("fixed inset-0 z-40", OVERLAY_CLASS)} />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-xl border bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold">
                {label}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {INVITE_USER_DIALOG.description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          {sentEmail ? (
            <div className="flex flex-col gap-3">
              {sendError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {INVITE_USER_DIALOG.errorPrefix}{" "}
                    <span className="font-medium">{sentEmail}</span>
                    {INVITE_USER_DIALOG.errorSuffix}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>
                    {INVITE_USER_DIALOG.successPrefix}{" "}
                    <span className="font-medium">{sentEmail}</span>
                    {INVITE_USER_DIALOG.successSuffix}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isResending}
                onClick={handleResend}
              >
                {isResending
                  ? INVITE_USER_DIALOG.resending
                  : INVITE_USER_DIALOG.resend}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleInvite)}>
              <div className="flex flex-col gap-3">
                <AppTextField
                  name="email"
                  control={control}
                  label={INVITE_USER_DIALOG.emailLabel}
                  required
                  placeholder={INVITE_USER_DIALOG.emailPlaceholder}
                  type="email"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting
                    ? INVITE_USER_DIALOG.sending
                    : INVITE_USER_DIALOG.send}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
