"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPORT } from "@/constants/exports";

type ExportButtonProps = {
  isExporting: boolean;
  onClick: () => void;
  /** Set while the listing has nothing to export. */
  disabled?: boolean;
  /** Why the button is disabled, shown on hover. */
  emptyHint?: string;
  label?: string;
  exportingLabel?: string;
  className?: string;
};

/** The "Exportar CSV" action shared by every listing header. */
export default function ExportButton({
  isExporting,
  onClick,
  disabled = false,
  emptyHint,
  label = EXPORT.label,
  exportingLabel = EXPORT.exporting,
  className = "self-start",
}: ExportButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      disabled={isExporting || disabled}
      title={emptyHint}
      onClick={onClick}
    >
      {isExporting ? (
        <Loader2 className="animate-spin" size={14} />
      ) : (
        <Download size={14} />
      )}
      {isExporting ? exportingLabel : label}
    </Button>
  );
}
