"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getSubjectEvolutionAction,
  listMeasurementsAction,
} from "@/services/measurement.service";
import {
  AlertSeverity,
  MeasurementAlert,
  MeasurementListItem,
  MeasurementSortOrder,
  SubjectEvolutionResponse,
} from "@/types/measurement";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import MeasurementEvolutionChart from "@/components/MeasurementEvolutionChart";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SORT_OPTIONS: { value: MeasurementSortOrder; label: string }[] = [
  { value: "date_desc", label: "Fecha (más reciente)" },
  { value: "date_asc", label: "Fecha (más antigua)" },
  { value: "weight_desc", label: "Peso (mayor)" },
  { value: "weight_asc", label: "Peso (menor)" },
  { value: "height_desc", label: "Talla (mayor)" },
  { value: "height_asc", label: "Talla (menor)" },
];

// Risk styling keyed off the highest-priority alert severity in a row.
const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

const SEVERITY_BADGE_CLASS: Record<AlertSeverity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

const SEVERITY_ROW_CLASS: Record<AlertSeverity, string> = {
  critical: "bg-destructive/5",
  high: "bg-orange-500/5",
  medium: "bg-amber-500/5",
};

function topSeverity(alerts: MeasurementAlert[]): AlertSeverity | null {
  if (alerts.length === 0) return null;
  return alerts.reduce<AlertSeverity>(
    (max, a) => (SEVERITY_RANK[a.severity] > SEVERITY_RANK[max] ? a.severity : max),
    alerts[0].severity,
  );
}

type Filters = {
  city: string;
  province: string;
  measuredFrom: string;
  measuredTo: string;
  minAge: string;
  maxAge: string;
};

const EMPTY_FILTERS: Filters = {
  city: "",
  province: "",
  measuredFrom: "",
  measuredTo: "",
  minAge: "",
  maxAge: "",
};

// "2026-03-01T10:00:00Z" -> "01/03/2026 10:00"
function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// "2023-01-15" -> "15/01/2023" without timezone shifts.
function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function MedicionesAntropometricasPage() {
  const { makeAuthorizedRequest } = useAuth();

  const [measurements, setMeasurements] = useState<MeasurementListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] =
    useState<Filters>(EMPTY_FILTERS);

  const [sortOrder, setSortOrder] = useState<MeasurementSortOrder>("date_desc");

  const [reloadKey, setReloadKey] = useState(0);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [evolution, setEvolution] = useState<SubjectEvolutionResponse | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Debounce filter changes and reset to the first page when they change.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [filters]);

  const fetchMeasurements = useCallback(
    async (
      currentPage: number,
      currentFilters: Filters,
      currentSortOrder: MeasurementSortOrder,
    ) => {
      // Guard inconsistent ranges client-side (backend returns 400 otherwise).
      const minAge =
        currentFilters.minAge !== "" ? Number(currentFilters.minAge) : undefined;
      const maxAge =
        currentFilters.maxAge !== "" ? Number(currentFilters.maxAge) : undefined;
      if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
        setMeasurements([]);
        setError("La edad mínima no puede ser mayor que la máxima.");
        setIsLoading(false);
        return;
      }
      if (
        currentFilters.measuredFrom &&
        currentFilters.measuredTo &&
        currentFilters.measuredFrom > currentFilters.measuredTo
      ) {
        setMeasurements([]);
        setError("La fecha desde no puede ser posterior a la fecha hasta.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await listMeasurementsAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: PAGE_SIZE,
          city: currentFilters.city || undefined,
          province: currentFilters.province || undefined,
          measured_from: currentFilters.measuredFrom || undefined,
          measured_to: currentFilters.measuredTo || undefined,
          min_age: minAge,
          max_age: maxAge,
          sort_order: currentSortOrder,
        });
        setMeasurements(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setMeasurements([]);
        setError(
          err instanceof Error ? err.message : "Error al cargar mediciones",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchMeasurements(page, debouncedFilters, sortOrder);
  }, [fetchMeasurements, page, debouncedFilters, sortOrder, reloadKey]);

  // Reflect changes made elsewhere when the user returns to the tab.
  useEffect(() => {
    const onFocus = () => setReloadKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const openEvolution = useCallback(
    async (subjectId: string) => {
      setSelectedSubjectId(subjectId);
      setEvolution(null);
      setDetailError(null);
      setDetailLoading(true);
      try {
        const data = await getSubjectEvolutionAction(
          makeAuthorizedRequest,
          subjectId,
        );
        setEvolution(data);
      } catch (err) {
        setDetailError(
          err instanceof Error
            ? err.message
            : "Error al cargar la evolución del sujeto",
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  const closeDetail = () => {
    setSelectedSubjectId(null);
    setEvolution(null);
    setDetailError(null);
  };

  return (
    <div className="flex flex-1 gap-4 p-4">
      <Card className="flex-1 p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Mediciones antropométricas
            </h1>
            <p className="text-muted-foreground text-sm">
              Peso, talla y fecha de relevamiento de los sujetos
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            <RefreshCw size={14} />
            Actualizar
          </Button>
        </div>

        <Separator />

        {/* Filters (CA3 + Notes) */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Ciudad</label>
            <Input
              value={filters.city}
              onChange={(e) => updateFilter("city", e.target.value)}
              placeholder="Ciudad"
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Provincia</label>
            <Input
              value={filters.province}
              onChange={(e) => updateFilter("province", e.target.value)}
              placeholder="Provincia"
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={filters.measuredFrom}
              onChange={(e) => updateFilter("measuredFrom", e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={filters.measuredTo}
              onChange={(e) => updateFilter("measuredTo", e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Edad mín.</label>
            <Input
              type="number"
              min={0}
              max={150}
              value={filters.minAge}
              onChange={(e) => updateFilter("minAge", e.target.value)}
              placeholder="0"
              className="w-24"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Edad máx.</label>
            <Input
              type="number"
              min={0}
              max={150}
              value={filters.maxAge}
              onChange={(e) => updateFilter("maxAge", e.target.value)}
              placeholder="150"
              className="w-24"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Ordenar por</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as MeasurementSortOrder);
                setPage(1);
              }}
              className={`${SELECT_CLASS} w-52`}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : measurements.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            No hay mediciones
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Peso (kg)</th>
                    <th className="px-4 py-3 font-medium">Talla (cm)</th>
                    <th className="px-4 py-3 font-medium">IMC</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Sujeto</th>
                    <th className="px-4 py-3 font-medium">Comedor</th>
                    <th className="px-4 py-3 font-medium">Responsable</th>
                    <th className="px-4 py-3 font-medium">Alertas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {measurements.map((m) => {
                    const severity = topSeverity(m.alerts);
                    const isSelected = selectedSubjectId === m.subject.id;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => openEvolution(m.subject.id)}
                        className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                          isSelected
                            ? "bg-muted/40"
                            : severity
                              ? SEVERITY_ROW_CLASS[severity]
                              : "bg-card"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {m.weight_kg}
                        </td>
                        <td className="px-4 py-3">{m.height_cm}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.bmi}
                        </td>
                        <td className="px-4 py-3">
                          {formatDateTime(m.measured_at)}
                        </td>
                        <td className="px-4 py-3">
                          {m.subject.name} {m.subject.last_name}
                          <span className="text-muted-foreground">
                            {" "}
                            ({m.subject.dni})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {m.establishment.name}
                          <span className="block text-xs text-muted-foreground">
                            {m.establishment.city}, {m.establishment.province}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.responsible.name} {m.responsible.last_name}
                        </td>
                        <td className="px-4 py-3">
                          {m.alerts.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {m.alerts.map((a, i) => (
                                <span
                                  key={`${a.alert_type}-${i}`}
                                  title={a.detail}
                                  className={`inline-block rounded-full border px-2 py-0.5 text-xs ${SEVERITY_BADGE_CLASS[a.severity]}`}
                                >
                                  {a.alert_type}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span>
                  Página {page} de {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Evolution panel (CA4) */}
      {selectedSubjectId && (
        <Card className="w-[34rem] shrink-0 p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold tracking-tight">
              {evolution
                ? `${evolution.subject.name} ${evolution.subject.last_name}`
                : "Evolución"}
            </h2>
            <Button size="sm" variant="ghost" onClick={closeDetail}>
              <X size={16} />
            </Button>
          </div>

          <Separator />

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={28}
              />
            </div>
          ) : detailError ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {detailError}
            </div>
          ) : evolution ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="Documento de identidad"
                  value={evolution.subject.dni}
                />
                <DetailField
                  label="Sexo"
                  value={
                    evolution.subject.sex === "male" ? "Masculino" : "Femenino"
                  }
                />
                <DetailField
                  label="Fecha de nacimiento"
                  value={formatDate(evolution.subject.birth_date)}
                />
                <DetailField
                  label="Mediciones"
                  value={evolution.points.length}
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  Evolución de peso y talla
                </span>
                <MeasurementEvolutionChart points={evolution.points} />
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
