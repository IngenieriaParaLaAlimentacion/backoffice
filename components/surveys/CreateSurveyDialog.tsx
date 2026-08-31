"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { FileText, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SURVEYS_PAGE } from "@/constants/surveys";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";

export default function CreateSurveyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button />}>
        <Plus size={16} />
        {SURVEYS_PAGE.createSurvey}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={cn("fixed inset-0 z-40", OVERLAY_CLASS)} />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-xl border bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <Dialog.Title className="text-lg font-semibold">
              {SURVEYS_PAGE.createSurvey}
            </Dialog.Title>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard/surveys/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <FileText size={20} className="text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Desde cero</span>
                <span className="text-xs text-muted-foreground">
                  Encuesta personalizada vacía
                </span>
              </div>
            </Link>

            <Link
              href="/dashboard/surveys/new?from=fies"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <Sparkles size={20} className="text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Plantilla FIES</span>
                <span className="text-xs text-muted-foreground">
                  Estructura estándar de 8 preguntas FIES
                </span>
              </div>
            </Link>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
