"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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
import { getMeAction } from "@/services/user.service";
import { getDashboardIndicatorsAction } from "@/services/dashboard.service";
import { listUsersAction } from "@/services/admin.service";
import { listEstablishmentRequestsAction } from "@/services/establishmentRequest.service";
import { ProfileResponse } from "@/types/user";
import { DashboardIndicators } from "@/types/survey";
import { navItems } from "@/components/SideBar";
import { Card } from "@/components/ui/card";
import { DASHBOARD_INDICATORS } from "@/constants/surveys";
import { UserStatus } from "@/types/establishment";

// Quick-access cards mirror the sidebar, minus the dashboard self-link.
const accessItems = navItems.filter((item) => item.href !== "/dashboard");

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
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {content}
    </div>
  );
}

export default function DashboardPage() {
  const { makeAuthorizedRequest } = useAuth();
  const [, setProfile] = useState<ProfileResponse | null>(null);
  const [indicators, setIndicators] = useState<DashboardIndicators | null>(
    null,
  );
  const [indicatorsLoading, setIndicatorsLoading] = useState(true);
  const [indicatorsError, setIndicatorsError] = useState<string | null>(null);

  const [pendingUserRegistrations, setPendingUserRegistrations] = useState<
    number | null
  >(null);
  const [pendingUserRegistrationsLoading, setPendingUserRegistrationsLoading] =
    useState(true);

  const [pendingEstablishmentCreations, setPendingEstablishmentCreations] =
    useState<number | null>(null);
  const [
    pendingEstablishmentCreationsLoading,
    setPendingEstablishmentCreationsLoading,
  ] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getMeAction(makeAuthorizedRequest);
      setProfile(data);
    } catch {
      // Silently ignore: the greeting falls back to a generic message.
    }
  }, [makeAuthorizedRequest]);

  const fetchIndicators = useCallback(async () => {
    setIndicatorsLoading(true);
    setIndicatorsError(null);
    try {
      const data = await getDashboardIndicatorsAction(makeAuthorizedRequest);
      setIndicators(data);
    } catch (err) {
      setIndicatorsError(
        err instanceof Error ? err.message : "Error al cargar los indicadores",
      );
    } finally {
      setIndicatorsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  const fetchPendingUserRegistrations = useCallback(async () => {
    setPendingUserRegistrationsLoading(true);
    try {
      const data = await listUsersAction(makeAuthorizedRequest, {
        status: PENDING_VALIDATION_STATUS,
        role: FIELD_WORKER_ROLE,
        ...COUNT_ONLY_QUERY,
      });
      setPendingUserRegistrations(data.total);
    } catch {
      setPendingUserRegistrations(null);
    } finally {
      setPendingUserRegistrationsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  const fetchPendingEstablishmentCreations = useCallback(async () => {
    setPendingEstablishmentCreationsLoading(true);
    try {
      const data = await listEstablishmentRequestsAction(
        makeAuthorizedRequest,
        COUNT_ONLY_QUERY,
      );
      setPendingEstablishmentCreations(data.total);
    } catch {
      setPendingEstablishmentCreations(null);
    } finally {
      setPendingEstablishmentCreationsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    fetchProfile();
    fetchIndicators();
    fetchPendingUserRegistrations();
    fetchPendingEstablishmentCreations();
  }, [
    fetchProfile,
    fetchIndicators,
    fetchPendingUserRegistrations,
    fetchPendingEstablishmentCreations,
  ]);

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              priority
              className="h-20 w-20 object-contain sm:h-28 sm:w-28"
            />
            <span className="text-center text-xl font-bold leading-tight tracking-tight text-primary sm:text-left sm:text-2xl">
              Ingeniería
              <br />
              Para La
              <br />
              Alimentación
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido!</h1>
        </div>

        {/* KPI Indicators (CA4) */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
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
              />
              <IndicatorCard
                icon={<UserCog size={18} />}
                value={
                  <span
                    className="text-muted-foreground"
                    title={DASHBOARD_INDICATORS.notAvailableHint}
                  >
                    {DASHBOARD_INDICATORS.notAvailable}
                  </span>
                }
                label={DASHBOARD_INDICATORS.pendingEstablishmentAccess}
              />
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
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Accesos disponibles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accessItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {item.icon}
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
