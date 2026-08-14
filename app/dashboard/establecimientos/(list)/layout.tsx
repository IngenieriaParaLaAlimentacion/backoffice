"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentRequestsAction } from "@/services/establishmentRequest.service";

const REQUESTS_TAB_HREF = "/dashboard/establecimientos/requests";

const TABS = [
  { label: "Establecimientos", href: "/dashboard/establecimientos" },
  { label: "Solicitudes", href: REQUESTS_TAB_HREF },
];

export default function EstablishmentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { makeAuthorizedRequest } = useAuth();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    listEstablishmentRequestsAction(makeAuthorizedRequest, {
      page: 1,
      page_size: 1,
    })
      .then((data) => {
        if (!cancelled) setPendingCount(data.total);
      })
      .catch(() => {
        if (!cancelled) setPendingCount(null);
      });

    return () => {
      cancelled = true;
    };
    // Re-check whenever the requests tab becomes active so approving/rejecting
    // a request is reflected in the badge as soon as the user comes back to it.
  }, [makeAuthorizedRequest, pathname]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
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
  );
}
