"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { Download, Eye, Loader2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENU_ITEM_CLASS } from "@/components/ui/menu";
import {
  NUTRITION_REPORT_PAGE as COPY,
  nutritionReportHref,
} from "@/constants/nutritionReport";
import { NutritionReportListItem } from "@/types/nutritionReport";

/**
 * The "⋮" of a report in the list: open it, or download its PDF without going
 * through the report screen. The PDF is refused while the AI text is missing,
 * so the item is disabled with the reason, as on the report screen.
 */
export default function NutritionReportActionsMenu({
  establishmentId,
  report,
  onDownload,
  busy,
}: {
  establishmentId: string;
  report: NutritionReportListItem;
  onDownload: () => void;
  busy: boolean;
}) {
  const textUnavailable = report.summary_status === "unavailable";

  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={busy}
        render={<Button variant="ghost" size="icon-sm" />}
        title={COPY.actionsMenuLabel}
        aria-label={COPY.actionsMenuLabel}
      >
        {busy ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <MoreVertical size={14} />
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4}>
          <Menu.Popup className="min-w-[180px] rounded-xl border bg-background p-1 shadow-xl">
            <Menu.Item
              className={MENU_ITEM_CLASS}
              render={
                <Link
                  href={nutritionReportHref(establishmentId, report.month)}
                />
              }
            >
              <Eye size={14} />
              {COPY.viewReport}
            </Menu.Item>
            <Menu.Item
              className={MENU_ITEM_CLASS}
              disabled={textUnavailable}
              title={textUnavailable ? COPY.pdfBlockedHint : undefined}
              onClick={onDownload}
            >
              <Download size={14} />
              {COPY.downloadPdf}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
