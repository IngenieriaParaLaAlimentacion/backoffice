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
import { useAuth } from "@/context/AuthContext";
import { inviteAdminAction } from "@/services/admin.service";

export default function InviteAdminDialog() {
  const [open, setOpen] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const { makeAuthorizedRequest } = useAuth();

  const {
    formState: { isSubmitting, isValid, errors },
    control,
    handleSubmit,
    setError,
    clearErrors,
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
    }
  }

  async function handleInvite({ email }: InviteAdminInput) {
    try {
      await inviteAdminAction(makeAuthorizedRequest, email);
      setSentEmail(email);
    } catch (err) {
      setError("form" as never, { message: (err as Error).message });
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger render={<Button size="sm" variant="outline" />}>
        <Plus size={14} />
        Invitar administrador
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-xl border bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold">
                Invitar administrador
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Se enviará un correo con el enlace de invitación.
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
            <Alert>
              <AlertDescription>
                Invitación enviada a{" "}
                <span className="font-medium">{sentEmail}</span>.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(handleInvite)}>
              <div className="flex flex-col gap-3">
                <AppTextField
                  name="email"
                  control={control}
                  label="Email"
                  required
                  placeholder="admin@ejemplo.com"
                  type="email"
                  onChange={() => clearErrors("form" as never)}
                />
                {(errors as Record<string, { message?: string }>).form && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {
                        (errors as Record<string, { message?: string }>).form
                          ?.message
                      }
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? "Enviando..." : "Enviar invitación"}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
