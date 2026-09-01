"use client";

import { ReactNode } from "react";
import { useSession } from "@/context/SessionContext";
import { Permission } from "@/lib/permissions";
import FullScreenMessage from "@/components/FullScreenMessage";
import { FORBIDDEN_SCREEN } from "@/constants/permissions";

const HOME_HREF = "/dashboard";

/**
 * Route-level counterpart to hiding a nav item: renders a 403 screen when the
 * logged-in role lacks `permission`, so typing the URL by hand doesn't show a
 * screen the sidebar deliberately hides. A UX guard — the backend still
 * refuses the underlying calls.
 *
 * Renders nothing while the role is unknown; the dashboard layout already
 * blocks on that, so this only matters if the guard is used elsewhere.
 */
export default function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can, isLoading } = useSession();

  if (isLoading) return null;

  if (!can(permission)) {
    return (
      <FullScreenMessage
        title={FORBIDDEN_SCREEN.title}
        body={FORBIDDEN_SCREEN.body}
        actionHref={HOME_HREF}
        actionLabel={FORBIDDEN_SCREEN.backToHome}
      />
    );
  }

  return <>{children}</>;
}
