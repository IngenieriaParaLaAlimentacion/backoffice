"use client";

import { useSession } from "@/context/SessionContext";
import { INVITE_LABELS } from "@/constants/users";
import {
  inviteAdminAction,
  inviteAnalystAction,
} from "@/services/admin.service";
import InviteUserDialog from "./[role]/InviteUserDialog";

const INVITES = {
  admin: { label: INVITE_LABELS.admin, action: inviteAdminAction },
  analyst: { label: INVITE_LABELS.analyst, action: inviteAnalystAction },
} as const;

/**
 * The invite entry point for a role's section: "Invitar administrador" /
 * "Invitar analista". Renders nothing for roles that can't be invited (field
 * workers sign up themselves) or when the viewer lacks `users.invite`.
 */
export default function RoleInviteButton({ role }: { role: string }) {
  const { can } = useSession();
  if (!can("users.invite") || !(role in INVITES)) return null;

  const { label, action } = INVITES[role as keyof typeof INVITES];
  return <InviteUserDialog label={label} inviteAction={action} />;
}
