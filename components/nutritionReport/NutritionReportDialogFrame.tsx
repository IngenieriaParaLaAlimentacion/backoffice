"use client";

import { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { DIALOG_POPUP_CLASS, OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";

// The stacking the other dialogs of the ficha use (EditEstablishmentDialog,
// ChangeRoleDialog).
const BACKDROP_CLASS = `fixed inset-0 z-[60] ${OVERLAY_CLASS}`;
const POPUP_CLASS = `${DIALOG_POPUP_CLASS} z-[70]`;

/** The backdrop and the card shared by the dialogs of the report screens. */
export default function NutritionReportDialogFrame({
  open,
  onOpenChange,
  widthClass,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The card's `max-w-*`. */
  widthClass: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={BACKDROP_CLASS} />
        <Dialog.Popup className={cn(POPUP_CLASS, widthClass)}>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
