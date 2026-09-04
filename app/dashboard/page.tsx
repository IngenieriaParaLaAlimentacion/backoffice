"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building,
  Building2,
  Calendar,
  FileText,
  Loader2,
  UserCog,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardIndicatorsAction } from "@/services/dashboard.service";
import {
  listPendingEstablishmentAccessAction,
  listUsersAction,
} from "@/services/admin.service";
import { listEstablishmentRequestsAction } from "@/services/establishmentRequest.service";
import { DashboardIndicators } from "@/types/survey";
import { visibleNavItems } from "@/constants/navigation";
import BrandMark from "@/components/BrandMark";
import { Card } from "@/components/ui/card";
import { BRAND } from "@/constants/brand";
import { DATA_CLASS } from "@/constants/theme";
import { DASHBOARD_INDICATORS } from "@/constants/surveys";
import { UserStatus } from "@/types/establishment";
import { usePendingCount } from "@/hooks/usePendingCount";
import { useSession } from "@/context/SessionContext";
import { getErrorMessage } from "@/lib/errorMessages";

const PENDING_VALIDATION_STATUS: UserStatus = "pending_validation";
const FIELD_WORKER_ROLE = "field_worker";
// "Just fetch the total" — smallest page that still returns the count.
const COUNT_ONLY_QUERY = { page: 1, page_size: 1 } as const;

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function IndicatorCard({
  icon,
  value,
  label,
  href,
  emphasize,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  href?: string;
  /** Draws attention with the app's destructive styling — use when there's at least 1 pending item. */
  emphasize?: boolean;
}) {
  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          emphasize
            ? "bg-destructive-container text-destructive"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {icon}
      </span>
      <div className="flex flex-col">
        {/* An indicator is a number read as data, so it takes the mono role. */}
        <span
          className={`${DATA_CLASS} text-xl font-medium ${emphasize ? "text-destructive" : ""}`}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </>
  );

  const baseClass = "flex items-center gap-3 rounded-xl border p-3";
  const toneClass = emphasize
    ? "border-destructive/30 bg-destructive/5"
    : "border-border bg-card";

  if (href) {
    const hoverClass = emphasize
      ? "hover:border-destructive/50 hover:bg-destructive/10"
      : "hover:border-accent-foreground/40 hover:bg-accent";
    return (
      <Link
        href={href}
        className={`${baseClass} ${toneClass} transition-colors ${hoverClass}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={`${baseClass} ${toneClass}`}>{content}</div>;
}

export default function DashboardPage() {
  const { makeAuthorizedRequest } = useAuth();
  const { role, can } = useSession();
  const canViewRequests = can("requests.view");
  const canViewEstablishmentRequests = can("establishments.requests.view");
  // Quick-access cards mirror the sidebar, minus the dashboard self-link.
  const accessItems = visibleNavItems(role).filter(
    (item) => item.href !== "/dashboard",
  );
  const [indicators, setIndicators] = useState<DashboardIndicators | null>(
    null,
  );
  const [indicatorsLoading, setIndicatorsLoading] = useState(true);
  const [indicatorsError, setIndicatorsError] = useState<string | null>(null);

  const {
    count: pendingUserRegistrations,
    loading: pendingUserRegistrationsLoading,
    fetch: fetchPendingUserRegistrations,
  } = usePendingCount(
    useCallback(async () => {
      const data = await listUsersAction(makeAuthorizedRequest, {
        status: PENDING_VALIDATION_STATUS,
        role: FIELD_WORKER_ROLE,
        ...COUNT_ONLY_QUERY,
      });
      return data.total;
    }, [makeAuthorizedRequest]),
  );

  const {
    count: pendingEstablishmentCreations,
    loading: pendingEstablishmentCreationsLoading,
    fetch: fetchPendingEstablishmentCreations,
  } = usePendingCount(
    useCallback(async () => {
      const data = await listEstablishmentRequestsAction(
        makeAuthorizedRequest,
        COUNT_ONLY_QUERY,
      );
      return data.total;
    }, [makeAuthorizedRequest]),
  );

  const {
    count: pendingEstablishmentAccess,
    loading: pendingEstablishmentAccessLoading,
    fetch: fetchPendingEstablishmentAccess,
  } = usePendingCount(
    useCallback(async () => {
      const data = await listPendingEstablishmentAccessAction(
        makeAuthorizedRequest,
        COUNT_ONLY_QUERY,
      );
      return data.total_pending_establishments;
    }, [makeAuthorizedRequest]),
  );

  const fetchIndicators = useCallback(async () => {
    setIndicatorsLoading(true);
    setIndicatorsError(null);
    try {
      const data = await getDashboardIndicatorsAction(makeAuthorizedRequest);
      setIndicators(data);
    } catch (err) {
      setIndicatorsError(
        getErrorMessage(err, { fallback: "Error al cargar los indicadores" }),
      );
    } finally {
      setIndicatorsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  // Approve/reject on every request type is admin-only, so analysts never
  // hit these admin-scoped counts — no point fetching what they can't act on.
  useEffect(() => {
    if (canViewRequests) {
      fetchPendingUserRegistrations();
      fetchPendingEstablishmentAccess();
    }
    if (canViewEstablishmentRequests) {
      fetchPendingEstablishmentCreations();
    }
  }, [
    canViewRequests,
    canViewEstablishmentRequests,
    fetchPendingUserRegistrations,
    fetchPendingEstablishmentCreations,
    fetchPendingEstablishmentAccess,
  ]);

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <BrandMark
              title={BRAND.logoAlt}
              className="h-20 w-20 sm:h-24 sm:w-24"
            />
            <span className="font-heading text-center text-3xl font-semibold leading-none sm:text-left sm:text-4xl">
              {BRAND.name}
            </span>
          </div>
          <h1 className="font-heading text-3xl font-semibold">¡Bienvenido!</h1>
        </div>

        {/* KPI Indicators (CA4) */}
        <div className="flex flex-col gap-3">
          <h2 className="font-sans text-sm font-medium text-muted-foreground">
            {DASHBOARD_INDICATORS.title}
          </h2>
          {indicatorsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={24}
              />
            </div>
          ) : indicatorsError ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {indicatorsError}
            </div>
          ) : indicators ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <IndicatorCard
                icon={<FileText size={18} />}
                value={indicators.response_count}
                label={DASHBOARD_INDICATORS.responseCount}
              />
              <IndicatorCard
                icon={<Building2 size={18} />}
                value={indicators.participating_establishments_count}
                label={DASHBOARD_INDICATORS.establishmentsCount}
              />
              <IndicatorCard
                icon={<Calendar size={18} />}
                value={
                  indicators.last_event_at
                    ? formatDate(indicators.last_event_at)
                    : DASHBOARD_INDICATORS.noDate
                }
                label={DASHBOARD_INDICATORS.lastEvent}
              />
              {canViewRequests && (
                <>
                  <IndicatorCard
                    icon={<UserPlus size={18} />}
                    value={
                      pendingUserRegistrationsLoading ? (
                        <Loader2
                          className="animate-spin text-muted-foreground"
                          size={18}
                        />
                      ) : (
                        (pendingUserRegistrations ??
                        DASHBOARD_INDICATORS.notAvailable)
                      )
                    }
                    label={DASHBOARD_INDICATORS.pendingUserRegistrations}
                    href="/dashboard/requests"
                    emphasize={
                      !pendingUserRegistrationsLoading &&
                      !!pendingUserRegistrations
                    }
                  />
                  <IndicatorCard
                    icon={<UserCog size={18} />}
                    value={
                      pendingEstablishmentAccessLoading ? (
                        <Loader2
                          className="animate-spin text-muted-foreground"
                          size={18}
                        />
                      ) : (
                        (pendingEstablishmentAccess ??
                        DASHBOARD_INDICATORS.notAvailable)
                      )
                    }
                    label={DASHBOARD_INDICATORS.pendingEstablishmentAccess}
                    href="/dashboard/requests/establishments"
                    emphasize={
                      !pendingEstablishmentAccessLoading &&
                      !!pendingEstablishmentAccess
                    }
                  />
                </>
              )}
              {canViewEstablishmentRequests && (
                <IndicatorCard
                  icon={<Building size={18} />}
                  value={
                    pendingEstablishmentCreationsLoading ? (
                      <Loader2
                        className="animate-spin text-muted-foreground"
                        size={18}
                      />
                    ) : (
                      (pendingEstablishmentCreations ??
                      DASHBOARD_INDICATORS.notAvailable)
                    )
                  }
                  label={DASHBOARD_INDICATORS.pendingEstablishmentCreations}
                  href="/dashboard/establishments/requests"
                  emphasize={
                    !pendingEstablishmentCreationsLoading &&
                    !!pendingEstablishmentCreations
                  }
                />
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-sans text-sm font-medium text-muted-foreground">
            Accesos disponibles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accessItems.map(({ icon: Icon, ...item }) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent-foreground/40 hover:bg-accent"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
