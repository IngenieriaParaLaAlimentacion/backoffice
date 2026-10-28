"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { NUTRITION_REPORT_NOTICE as COPY } from "@/constants/nutritionReport";
import { DIALOG_POPUP_CLASS, OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";

export type ReportNotice = { title: string; message: string };

/**
 * Tells the outcome of an action whose result is not visible on its own (a
 * month calculated again that came back unchanged), and stays until it is
 * closed so it cannot be missed nor linger on the screen.
 */
export default function NutritionReportNoticeDialog({
  notice,
  onClose,
}: {
  notice: ReportNotice | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={notice !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn("fixed inset-0 z-[60]", OVERLAY_CLASS)}
        />
        <Dialog.Popup className={cn(DIALOG_POPUP_CLASS, "z-[70] max-w-sm")}>
          <Dialog.Title className="text-lg font-semibold">
            {notice?.title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            {notice?.message}
          </Dialog.Description>
          <div className="flex justify-end">
            <Dialog.Close render={<Button />}>{COPY.close}</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
