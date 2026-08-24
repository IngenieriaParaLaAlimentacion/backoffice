"use client";

import { Menu } from "@base-ui/react/menu";
import { Loader2, MoreVertical, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENU_ITEM_CLASS } from "@/components/ui/menu";

/**
 * Single-item kebab menu for revoking a user↔establishment relation, shared
 * by the establishment-detail and user-detail views. Matches
 * SurveyActionsMenu's pattern (icon-only trigger, destructive item).
 */
export default function RevokeAccessMenu({
  label,
  menuLabel,
  isSubmitting,
  onRevoke,
}: {
  label: string;
  menuLabel: string;
  isSubmitting: boolean;
  onRevoke: () => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={isSubmitting}
        render={<Button variant="ghost" size="icon-sm" />}
        title={menuLabel}
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <MoreVertical size={14} />
        )}
      </Menu.Trigger>
      <Menu.Portal>
        {/* Explicit z-index: this menu can open from inside a Dialog.Popup
            (z-50, e.g. UserDetailPanel), which would otherwise sit on top. */}
        <Menu.Positioner
          side="bottom"
          align="end"
          sideOffset={4}
          className="z-[60]"
        >
          <Menu.Popup className="min-w-[180px] rounded-xl border bg-background p-1 shadow-xl">
            <Menu.Item
              className={`${MENU_ITEM_CLASS} text-destructive data-[highlighted]:bg-destructive/20`}
              onClick={onRevoke}
            >
              <UserMinus size={14} />
              {label}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
