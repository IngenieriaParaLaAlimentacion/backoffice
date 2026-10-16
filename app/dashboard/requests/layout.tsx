"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listPendingEstablishmentAccessAction,
  listUsersAction,
} from "@/services/admin.service";
import { listEstablishmentRequestsAction } from "@/services/establishmentRequest.service";
import { usePendingCount } from "@/hooks/usePendingCount";
import { REQUEST_TABS } from "@/constants/users";
import RequirePermission from "@/components/RequirePermission";

const USERS_TAB_HREF = "/dashboard/requests";
const ESTABLISHMENTS_TAB_HREF = "/dashboard/requests/establishments";
const CREATIONS_TAB_HREF = "/dashboard/requests/establishment-creations";

const COUNT_ONLY_QUERY = { page: 1, page_size: 1 } as const;

// Lets each tab tell the layout to refresh the badges right after an
// approve/reject, since those actions don't navigate anywhere (the
// pathname-based refetch below never re-runs on its own).
const RefreshRequestCountsContext = createContext<() => void>(() => {});

export const useRefreshRequestCounts = () =>
  useContext(RefreshRequestCountsContext);

export default function RequestsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RequirePermission permission="requests.view">
      <RequestsTabs>{children}</RequestsTabs>
    </RequirePermission>
  );
}

/**
 * Split out so the admin-only pending-count fetches below never run for a
 * role that can't see this screen — `RequirePermission` renders nothing for
 * them, so this component never mounts.
 */
function RequestsTabs({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { makeAuthorizedRequest } = useAuth();

  const { count: pendingUsers, fetch: fetchPendingUsers } = usePendingCount(
    useCallback(async () => {
      const data = await listUsersAction(makeAuthorizedRequest, {
        ...COUNT_ONLY_QUERY,
        status: "pending_validation",
        role: "field_worker",
      });
      return data.total;
    }, [makeAuthorizedRequest]),
  );

  const { count: pendingAccess, fetch: fetchPendingAccess } = usePendingCount(
    useCallback(async () => {
      const data = await listPendingEstablishmentAccessAction(
        makeAuthorizedRequest,
        COUNT_ONLY_QUERY,
      );
      // Counts pending accesses, not field workers: same figure as the
      // dashboard KPI.
      return data.total_pending_establishments;
    }, [makeAuthorizedRequest]),
  );

  const { count: pendingCreations, fetch: fetchPendingCreations } =
    usePendingCount(
      useCallback(async () => {
        const data = await listEstablishmentRequestsAction(
          makeAuthorizedRequest,
          COUNT_ONLY_QUERY,
        );
        return data.total;
      }, [makeAuthorizedRequest]),
    );

  const refreshCounts = useCallback(() => {
    fetchPendingUsers();
    fetchPendingAccess();
    fetchPendingCreations();
  }, [fetchPendingUsers, fetchPendingAccess, fetchPendingCreations]);

  useEffect(() => {
    // Re-check whenever a tab becomes active so navigating between them also
    // catches changes made elsewhere (e.g. another tab/admin).
    refreshCounts();
  }, [refreshCounts, pathname]);

  const tabs = [
    { label: REQUEST_TABS.users, href: USERS_TAB_HREF, count: pendingUsers },
    {
      label: REQUEST_TABS.establishments,
      href: ESTABLISHMENTS_TAB_HREF,
      count: pendingAccess,
    },
    {
      label: REQUEST_TABS.establishmentCreations,
      href: CREATIONS_TAB_HREF,
      count: pendingCreations,
    },
  ];

  return (
    <RefreshRequestCountsContext.Provider value={refreshCounts}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {!!tab.count && (
                  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-none text-destructive-foreground">
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </RefreshRequestCountsContext.Provider>
  );
}
