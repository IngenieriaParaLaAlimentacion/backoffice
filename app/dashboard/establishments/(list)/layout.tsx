"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentRequestsAction } from "@/services/establishmentRequest.service";
import { getMeAction } from "@/services/user.service";
import { ESTABLISHMENT_TABS } from "@/constants/establishments";

const REQUESTS_TAB_HREF = "/dashboard/establishments/requests";
const ADMIN_ROLES = new Set(["admin", "superadmin"]);

const BASE_TABS = [
  {
    label: ESTABLISHMENT_TABS.establishments,
    href: "/dashboard/establishments",
  },
];
const REQUESTS_TAB = {
  label: ESTABLISHMENT_TABS.requests,
  href: REQUESTS_TAB_HREF,
};

// Lets the requests page tell the layout to refresh the tab badge right
// after an approve/reject, since that action doesn't navigate anywhere
// (the pathname-based refetch below never re-runs on its own).
const RefreshPendingCountContext = createContext<() => void>(() => {});

export const useRefreshPendingRequestsCount = () =>
  useContext(RefreshPendingCountContext);

export default function EstablishmentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { makeAuthorizedRequest } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMeAction(makeAuthorizedRequest)
      .then((profile) => {
        if (!cancelled) setIsAdmin(ADMIN_ROLES.has(profile.role));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [makeAuthorizedRequest]);

  const refreshPendingCount = useCallback(() => {
    if (!isAdmin) return;

    listEstablishmentRequestsAction(makeAuthorizedRequest, {
      page: 1,
      page_size: 1,
    })
      .then((data) => setPendingCount(data.total))
      .catch(() => setPendingCount(null));
  }, [isAdmin, makeAuthorizedRequest]);

  useEffect(() => {
    // Re-check whenever the requests tab becomes active so navigating back
    // into it also catches changes made elsewhere (e.g. another tab/admin).
    refreshPendingCount();
  }, [refreshPendingCount, pathname]);

  const tabs = isAdmin ? [...BASE_TABS, REQUESTS_TAB] : BASE_TABS;

  return (
    <RefreshPendingCountContext.Provider value={refreshPendingCount}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const showBadge = tab.href === REQUESTS_TAB_HREF && !!pendingCount;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {showBadge && (
                  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-none text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </RefreshPendingCountContext.Provider>
  );
}
