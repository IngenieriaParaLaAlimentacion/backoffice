"use client";

import { use } from "react";
import { useEstablishmentDashboard } from "@/hooks/useEstablishmentDashboard";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import FullScreenMessage from "@/components/FullScreenMessage";
import EstablishmentHeader from "./EstablishmentHeader";
import EstablishmentMetrics from "./EstablishmentMetrics";
import EstablishmentAlertBanner from "./EstablishmentAlertBanner";
import EstablishmentSubjectsList from "./EstablishmentSubjectsList";
import EstablishmentFieldWorkersList from "./EstablishmentFieldWorkersList";
import { ESTABLISHMENT_DASHBOARD_PAGE as COPY } from "@/constants/establishments";
import { Loader2 } from "lucide-react";

const PANEL_HREF = "/dashboard/establishments";

export default function EstablishmentDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

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

  // The lists mount right away so their requests go out alongside the dashboard
  // one instead of waiting for it.
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
          </>
        )}

        <Separator />

        <EstablishmentSubjectsList
          establishmentId={id}
          establishmentName={dashboard?.establishment.name}
        />

        <Separator />

        <EstablishmentFieldWorkersList establishmentId={id} />
      </Card>
    </div>
  );
}
