"use client";

import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import {
  Copy,
  Loader2,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENU_ITEM_CLASS } from "@/components/ui/menu";
import { SurveyListItem } from "@/types/survey";
import { SURVEY_FORM, SURVEYS_PAGE } from "@/constants/surveys";
import { useSession } from "@/context/SessionContext";

export default function SurveyActionsMenu({
  survey,
  onDuplicate,
  onToggleStatus,
  onDelete,
  busy,
}: {
  survey: SurveyListItem;
  onDuplicate: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const router = useRouter();
  const canDelete = useSession().can("surveys.delete");
  const editLocked = survey.response_count > 0;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Menu.Root>
        <Menu.Trigger
          disabled={busy}
          render={<Button variant="ghost" size="icon-sm" />}
          title={SURVEYS_PAGE.actionsMenuLabel}
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
                disabled={editLocked}
                title={editLocked ? SURVEYS_PAGE.editDisabledReason : undefined}
                onClick={
                  editLocked
                    ? undefined
                    : () => router.push(`/dashboard/surveys/${survey.id}`)
                }
              >
                <Pencil size={14} />
                {SURVEYS_PAGE.edit}
              </Menu.Item>
              <Menu.Item className={MENU_ITEM_CLASS} onClick={onDuplicate}>
                <Copy size={14} />
                {SURVEYS_PAGE.duplicate}
              </Menu.Item>
              <div className="my-1 h-px bg-border" />
              <Menu.Item className={MENU_ITEM_CLASS} onClick={onToggleStatus}>
                <Power size={14} />
                {survey.is_active
                  ? SURVEY_FORM.deactivate
                  : SURVEY_FORM.activate}
              </Menu.Item>
              {canDelete && (
                <Menu.Item
                  className={`${MENU_ITEM_CLASS} text-destructive data-[highlighted]:bg-destructive/20`}
                  onClick={onDelete}
                >
                  <Trash2 size={14} />
                  {SURVEY_FORM.delete}
                </Menu.Item>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
