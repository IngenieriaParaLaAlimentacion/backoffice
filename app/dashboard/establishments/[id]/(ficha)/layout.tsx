"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, use, useContext } from "react";
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
} from "@/constants/establishments";
import { EstablishmentDashboardResponse } from "@/types/establishment";
import { Loader2 } from "lucide-react";

const PANEL_HREF = "/dashboard/establishments";

// Lets the tab pages (summary, stock) reuse the establishment already fetched
// here instead of each re-fetching the dashboard themselves.
const EstablishmentDashboardContext =
  createContext<EstablishmentDashboardResponse | null>(null);

export const useEstablishmentDashboardContext = () =>
  useContext(EstablishmentDashboardContext);

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
  const { dashboard, isLoading, error, notFound, forbidden } =
    useEstablishmentDashboard(id);

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
  ];

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        {isLoading || !dashboard ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : (
          <>
            <EstablishmentHeader establishment={dashboard.establishment} />

            <Separator />

            <EstablishmentMetrics
              hasData={dashboard.has_data}
              metrics={dashboard.metrics}
            />

            {dashboard.has_data && (
              <EstablishmentAlertBanner alertStatus={dashboard.alert_status} />
            )}

            <Separator />

            <div className="flex gap-1 border-b border-border">
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
                    className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
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
              {children}
            </EstablishmentDashboardContext.Provider>
          </>
        )}
      </Card>
    </div>
  );
}
