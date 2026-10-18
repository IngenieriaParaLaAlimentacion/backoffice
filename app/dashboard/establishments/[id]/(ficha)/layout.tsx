"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, use, useContext, useEffect, useRef } from "react";
import { useEstablishmentDashboard } from "@/hooks/useEstablishmentDashboard";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import FullScreenMessage from "@/components/FullScreenMessage";
import EstablishmentHeader from "../EstablishmentHeader";
import EstablishmentMetrics from "../EstablishmentMetrics";
import EstablishmentAlertBanner from "../EstablishmentAlertBanner";
import {
  ESTABLISHMENT_DASHBOARD_PAGE as COPY,
  ESTABLISHMENT_DETAIL_TABS,
  establishmentProfileHref,
} from "@/constants/establishments";
import {
  EstablishmentCharacterizationResponse,
  EstablishmentDashboardResponse,
} from "@/types/establishment";
import { useSession } from "@/context/SessionContext";
import { Loader2 } from "lucide-react";

const PANEL_HREF = "/dashboard/establishments";

// Lets the tab pages (summary, stock) reuse the establishment already fetched
// here instead of each re-fetching the dashboard themselves.
const EstablishmentDashboardContext =
  createContext<EstablishmentDashboardResponse | null>(null);

export const useEstablishmentDashboardContext = () =>
  useContext(EstablishmentDashboardContext);

// Lets the Perfil tab push a saved profile back into the header (pending
// badge / summary line) without refetching the dashboard.
const ApplyCharacterizationContext = createContext<
  (result: EstablishmentCharacterizationResponse) => void
>(() => {});

export const useApplyCharacterization = () =>
  useContext(ApplyCharacterizationContext);

export default function EstablishmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();

  // The three endpoints are independent and fire in parallel (one hook each);
  // only this one gates the screen.
  const {
    dashboard,
    isLoading,
    error,
    notFound,
    forbidden,
    applyCharacterization,
  } = useEstablishmentDashboard(id);
  const { can } = useSession();

  // On a narrow screen the tab bar scrolls sideways; bring the active tab into
  // view (e.g. a deep link to Perfil, the last one). Only the bar scrolls —
  // `scrollIntoView` would also scroll the page down to it.
  const tabBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = tabBarRef.current;
    const active = bar?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!bar || !active) return;
    bar.scrollLeft =
      active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
  }, [pathname, dashboard]);

  // 404 (the comedor does not exist) is a different situation from the empty
  // state (it exists but has no measurements) and renders differently.
  if (notFound) {
    return (
      <FullScreenMessage
        title={COPY.notFoundTitle}
        body={COPY.notFoundBody}
        actionHref={PANEL_HREF}
        actionLabel={COPY.backToPanel}
      />
    );
  }

  if (forbidden) {
    return (
      <FullScreenMessage
        title={COPY.forbiddenTitle}
        body={COPY.forbiddenBody}
        actionHref={PANEL_HREF}
        actionLabel={COPY.backToPanel}
      />
    );
  }

  if (error && !dashboard) {
    return (
      <div className="flex flex-1 p-4">
        <Card className="flex-1 p-4 md:p-8">
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        </Card>
      </div>
    );
  }

  const baseHref = `/dashboard/establishments/${id}`;
  const tabs = [
    { label: ESTABLISHMENT_DETAIL_TABS.subjects, href: baseHref },
    {
      label: ESTABLISHMENT_DETAIL_TABS.fieldWorkers,
      href: `${baseHref}/field-workers`,
    },
    { label: ESTABLISHMENT_DETAIL_TABS.stock, href: `${baseHref}/stock` },
    {
      label: ESTABLISHMENT_DETAIL_TABS.profile,
      href: establishmentProfileHref(id),
    },
  ];

  return (
    <div className="flex flex-1 p-4">
      {/* `min-w-0` lets the card shrink to the viewport: as a flex item it
          otherwise grows to its widest child, and its `overflow-hidden`
          clipped the tab bar instead of letting it scroll. */}
      <Card className="min-w-0 flex-1 p-4 md:p-8 flex flex-col gap-6">
        {isLoading || !dashboard ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : (
          <>
            <EstablishmentHeader
              establishment={dashboard.establishment}
              characterization={dashboard.characterization}
              completeProfileHref={
                can("establishments.characterization.edit")
                  ? establishmentProfileHref(id, true)
                  : undefined
              }
            />

            <Separator />

            <EstablishmentMetrics
              hasData={dashboard.has_data}
              metrics={dashboard.metrics}
            />

            {dashboard.has_data && (
              <EstablishmentAlertBanner alertStatus={dashboard.alert_status} />
            )}

            <Separator />

            {/* The baseline is an inset shadow, not a border the active tab
                overlaps with -mb-px: an overflow container would clip that
                overlap. */}
            <div
              ref={tabBarRef}
              className="flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-border)]"
            >
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    // Switching tabs must not grow browser history — otherwise
                    // "Volver" (router.back() in EstablishmentHeader) steps
                    // through Sujetos/Relevadores/Stock instead of leaving the
                    // ficha straight back to the establishments list.
                    replace
                    aria-current={isActive ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            <EstablishmentDashboardContext.Provider value={dashboard}>
              <ApplyCharacterizationContext.Provider
                value={applyCharacterization}
              >
                {children}
              </ApplyCharacterizationContext.Provider>
            </EstablishmentDashboardContext.Provider>
          </>
        )}
      </Card>
    </div>
  );
}
