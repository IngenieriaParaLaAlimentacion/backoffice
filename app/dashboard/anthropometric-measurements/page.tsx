"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import MeasurementObservation from "./MeasurementObservation";
import { useAuth } from "@/context/AuthContext";
import {
  exportMeasurementsAction,
  getSubjectEvolutionAction,
  listMeasurementsAction,
  MeasurementFilters,
} from "@/services/measurement.service";
import {
  MeasurementListItem,
  MeasurementSortOrder,
  SubjectEvolutionResponse,
} from "@/types/measurement";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import MeasurementEvolutionChart from "@/components/MeasurementEvolutionChart";
import Pagination from "@/components/Pagination";
import ExportButton from "@/components/listings/ExportButton";
import ExportError from "@/components/listings/ExportError";
import { useCsvExport } from "@/hooks/useCsvExport";
import { EXPORT, EXPORT_FILENAMES } from "@/constants/exports";
import {
  SEVERITY_ROW_CLASS,
  topMeasurementSeverity,
} from "@/components/AlertBadge";
import {
  ageInMonths,
  argentineToday,
  formatAgeMonths,
  formatDate,
  formatTimestamp,
  formatTimestampDate,
} from "@/lib/format";
import { useRenderClock } from "@/hooks/useRenderClock";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowChevron,
  ROW_HOVER_CLASS,
  rowStateClass,
} from "@/components/listings/RowAffordance";
import {
  FilterPanel,
  FiltersToggle,
} from "@/components/listings/FiltersToggle";
import { Loader2, RefreshCw, X } from "lucide-react";
import {
  MAX_AGE,
  MEASUREMENT_SORT_LABELS,
  MEASUREMENTS_PAGE,
  MIN_AGE,
} from "@/constants/measurements";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { parseAgeFilter } from "@/lib/ageFilter";
import { getErrorMessage } from "@/lib/errorMessages";
import { ApiError, ERROR_TYPES } from "@/lib/apiError";
import MeasurementAssessmentList from "@/components/MeasurementAssessmentList";
import MeasurementAssessmentFilters, {
  assessmentFilterSupported,
} from "@/components/listings/MeasurementAssessmentFilters";
import type { AssessmentFilter, AssessmentFilters } from "@/types/measurement";
import { SELECT_CLASS } from "@/constants/common";

const PAGE_SIZE = 20;

const FILTER_DEBOUNCE_MS = 300;

// Keep note previews readable without letting a 500-character note dominate the table.
const OBSERVATION_CELL_CLASS = "min-w-48 max-w-xs px-4 py-3";

const SORT_OPTIONS: { value: MeasurementSortOrder; label: string }[] = (
  Object.keys(MEASUREMENT_SORT_LABELS) as MeasurementSortOrder[]
).map((value) => ({ value, label: MEASUREMENT_SORT_LABELS[value] }));

type Filters = {
  assessment: AssessmentFilter | null;
  city: string;
  province: string;
  measuredFrom: string;
  measuredTo: string;
  minAge: string;
  maxAge: string;
};

const EMPTY_FILTERS: Filters = {
  assessment: null,
  city: "",
  province: "",
  measuredFrom: "",
  measuredTo: "",
  minAge: "",
  maxAge: "",
};

/** Maps the page's text filters onto the API's query params. */
function toMeasurementFilters(
  filters: Filters,
  sortOrder: MeasurementSortOrder,
): MeasurementFilters {
  return {
    assessment: filters.assessment ?? undefined,
    city: filters.city || undefined,
    province: filters.province || undefined,
    measured_from: filters.measuredFrom || undefined,
    measured_to: filters.measuredTo || undefined,
    min_age: filters.minAge !== "" ? Number(filters.minAge) : undefined,
    max_age: filters.maxAge !== "" ? Number(filters.maxAge) : undefined,
    sort_order: sortOrder,
  };
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

export default function AnthropometricMeasurementsPage() {
  const { makeAuthorizedRequest, makeAuthorizedDownload } = useAuth();

  const [measurements, setMeasurements] = useState<MeasurementListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] =
    useState<Filters>(EMPTY_FILTERS);

  const [sortOrder, setSortOrder] = useState<MeasurementSortOrder>("date_desc");

  const [reloadKey, setReloadKey] = useState(0);
  const [assessmentOptions, setAssessmentOptions] =
    useState<AssessmentFilters | null>(null);
  const [visibleQuery, setVisibleQuery] = useState<{
    filters: Filters;
    sortOrder: MeasurementSortOrder;
  } | null>(null);
  const listRequest = useRef(0);

  const [selectedMeasurement, setSelectedMeasurement] =
    useState<MeasurementListItem | null>(null);
  const evolutionRequest = useRef(0);
  const [evolution, setEvolution] = useState<SubjectEvolutionResponse | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const now = useRenderClock(evolution);
  const [detailError, setDetailError] = useState<string | null>(null);

  const {
    isExporting,
    error: exportError,
    clearError: clearExportError,
    runExport,
  } = useCsvExport();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    filters.assessment,
    filters.city,
    filters.province,
    filters.measuredFrom,
    filters.measuredTo,
    filters.minAge,
    filters.maxAge,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

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
      const request = ++listRequest.current;
      const clearStaleAssessment = () =>
        setFilters((previous) =>
          previous.assessment &&
          previous.assessment === currentFilters.assessment
            ? { ...previous, assessment: null }
            : previous,
        );

      // Guard invalid and inconsistent ranges client-side: the backend answers
      // with a 422 and a 400 respectively, neither of which names a filter.
      const minAge = parseAgeFilter(currentFilters.minAge);
      const maxAge = parseAgeFilter(currentFilters.maxAge);
      if (minAge === null || maxAge === null) {
        setMeasurements([]);
        setError(MEASUREMENTS_PAGE.invalidAgeError);
        setIsLoading(false);
        return;
      }
      if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
        setMeasurements([]);
        setError(MEASUREMENTS_PAGE.minAgeGreaterThanMaxError);
        setIsLoading(false);
        return;
      }
      if (
        currentFilters.measuredFrom &&
        currentFilters.measuredTo &&
        currentFilters.measuredFrom > currentFilters.measuredTo
      ) {
        setMeasurements([]);
        setError(MEASUREMENTS_PAGE.measuredFromAfterToError);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await listMeasurementsAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: PAGE_SIZE,
          ...toMeasurementFilters(currentFilters, currentSortOrder),
        });
        if (request !== listRequest.current) return;
        setAssessmentOptions(data.assessment_filters ?? null);
        if (
          currentFilters.assessment &&
          !assessmentFilterSupported(
            currentFilters.assessment,
            data.assessment_filters,
          )
        ) {
          clearStaleAssessment();
          return;
        }
        setVisibleQuery({
          filters: currentFilters,
          sortOrder: currentSortOrder,
        });
        setMeasurements(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        if (request !== listRequest.current) return;
        if (
          currentFilters.assessment &&
          err instanceof ApiError &&
          err.type === ERROR_TYPES.FILTER_NOT_APPLICABLE
        ) {
          clearStaleAssessment();
          return;
        }

        setMeasurements([]);
        setTotal(0);
        setError(
          getErrorMessage(err, { fallback: MEASUREMENTS_PAGE.loadError }),
        );
      } finally {
        if (request === listRequest.current) setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchMeasurements(page, debouncedFilters, sortOrder);
    return () => {
      listRequest.current += 1;
    };
  }, [fetchMeasurements, page, debouncedFilters, sortOrder, reloadKey]);

  // Reflect changes made elsewhere when the user returns to the tab.
  useEffect(() => {
    const onFocus = () => setReloadKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // The export asks for exactly the rows the listing is showing.
  const exportFilters = useMemo(
    () => toMeasurementFilters(debouncedFilters, sortOrder),
    [debouncedFilters, sortOrder],
  );

  const handleExport = () =>
    runExport(
      () =>
        exportMeasurementsAction(
          makeAuthorizedDownload,
          exportFilters,
          assessmentOptions !== null,
        ),
      EXPORT_FILENAMES.measurements,
    );

  const openEvolution = useCallback(
    async (measurement: MeasurementListItem) => {
      const request = ++evolutionRequest.current;
      setSelectedMeasurement(measurement);
      setEvolution(null);
      setDetailError(null);
      setDetailLoading(true);
      try {
        const data = await getSubjectEvolutionAction(
          makeAuthorizedRequest,
          measurement.subject.id,
        );
        if (request === evolutionRequest.current) setEvolution(data);
      } catch (err) {
        if (request !== evolutionRequest.current) return;
        setDetailError(
          getErrorMessage(err, { fallback: MEASUREMENTS_PAGE.evolutionError }),
        );
      } finally {
        if (request === evolutionRequest.current) setDetailLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  const closeDetail = () => {
    evolutionRequest.current += 1;
    setSelectedMeasurement(null);
    setEvolution(null);
    setDetailError(null);
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 min-w-0 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">
              {MEASUREMENTS_PAGE.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {MEASUREMENTS_PAGE.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <ExportButton
              isExporting={isExporting}
              onClick={handleExport}
              disabled={
                isLoading ||
                !!error ||
                total === 0 ||
                visibleQuery?.filters !== filters ||
                visibleQuery.sortOrder !== sortOrder
              }
              emptyHint={total === 0 ? EXPORT.empty : undefined}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <RefreshCw size={14} />
              {MEASUREMENTS_PAGE.refresh}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Sort (always visible) and collapsible filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {MEASUREMENTS_PAGE.sortLabel}
              </label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as MeasurementSortOrder);
                  setPage(1);
                }}
                className={`${SELECT_CLASS} w-full sm:w-52`}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <FiltersToggle
              open={filtersOpen}
              onToggle={() => setFiltersOpen((o) => !o)}
              activeCount={activeFilterCount}
              hasActiveFilters={hasActiveFilters}
              onClear={() => setFilters(EMPTY_FILTERS)}
            />
          </div>

          <FilterPanel open={filtersOpen}>
            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {MEASUREMENTS_PAGE.filters.city}
              </label>
              <Input
                value={filters.city}
                onChange={(e) => updateFilter("city", e.target.value)}
                placeholder={MEASUREMENTS_PAGE.filters.city}
                className="w-full sm:w-40"
              />
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {MEASUREMENTS_PAGE.filters.province}
              </label>
              <Input
                value={filters.province}
                onChange={(e) => updateFilter("province", e.target.value)}
                placeholder={MEASUREMENTS_PAGE.filters.province}
                className="w-full sm:w-40"
              />
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {MEASUREMENTS_PAGE.filters.measuredDate}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {MEASUREMENTS_PAGE.filters.from}
                  </span>
                  <Input
                    type="date"
                    value={filters.measuredFrom}
                    onChange={(e) =>
                      updateFilter("measuredFrom", e.target.value)
                    }
                    className="w-full sm:w-36"
                  />
                </div>
                <span className="mt-3 text-muted-foreground">–</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {MEASUREMENTS_PAGE.filters.to}
                  </span>
                  <Input
                    type="date"
                    value={filters.measuredTo}
                    onChange={(e) => updateFilter("measuredTo", e.target.value)}
                    className="w-full sm:w-36"
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {MEASUREMENTS_PAGE.filters.age}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {MEASUREMENTS_PAGE.filters.min}
                  </span>
                  <Input
                    type="number"
                    min={MIN_AGE}
                    max={MAX_AGE}
                    step={1}
                    value={filters.minAge}
                    onChange={(e) => updateFilter("minAge", e.target.value)}
                    placeholder={String(MIN_AGE)}
                    className="w-full sm:w-20"
                  />
                </div>
                <span className="mt-3 text-muted-foreground">–</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {MEASUREMENTS_PAGE.filters.max}
                  </span>
                  <Input
                    type="number"
                    min={MIN_AGE}
                    max={MAX_AGE}
                    step={1}
                    value={filters.maxAge}
                    onChange={(e) => updateFilter("maxAge", e.target.value)}
                    placeholder={String(MAX_AGE)}
                    className="w-full sm:w-20"
                  />
                </div>
              </div>
            </div>
            {assessmentOptions && (
              <MeasurementAssessmentFilters
                options={assessmentOptions}
                value={filters.assessment}
                onChange={(assessment) =>
                  updateFilter("assessment", assessment)
                }
              />
            )}
          </FilterPanel>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {exportError && (
          <ExportError message={exportError} onDismiss={clearExportError} />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : measurements.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {MEASUREMENTS_PAGE.noMeasurements}
          </div>
        ) : (
          <>
            <div className="hidden overflow-auto max-h-[70vh] rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted text-muted-foreground text-left [&>th]:sticky [&>th]:top-0">
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.weight}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.height}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.bmi}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.date}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.subject}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.establishment}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.responsible}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.alerts}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {MEASUREMENTS_PAGE.columns.observation}
                    </th>
                    <ChevronHeaderCell />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {measurements.map((m) => {
                    const severity = topMeasurementSeverity(m);
                    const isSelected = selectedMeasurement?.id === m.id;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => openEvolution(m)}
                        className={`${ROW_HOVER_CLASS} ${rowStateClass(isSelected, severity ? SEVERITY_ROW_CLASS[severity] : undefined)}`}
                      >
                        <td className="px-4 py-3 font-medium">{m.weight_kg}</td>
                        <td className="px-4 py-3">{m.height_cm}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.bmi}
                        </td>
                        <td className="px-4 py-3">
                          {formatTimestampDate(m.measured_at)}
                        </td>
                        <td className="px-4 py-3">
                          {m.subject.name} {m.subject.last_name}
                          <span className="text-muted-foreground">
                            {" "}
                            ({m.subject.dni})
                          </span>
                        </td>
                        <td className="px-4 py-3">{m.establishment.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.responsible.name} {m.responsible.last_name}
                        </td>
                        <td className="px-4 py-3">
                          <MeasurementAssessmentList
                            alerts={m.alerts}
                            assessments={m.assessments}
                          />
                        </td>
                        <td className={OBSERVATION_CELL_CLASS}>
                          <MeasurementObservation observation={m.observation} />
                        </td>
                        <ChevronCell />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              role="list"
              aria-label={MEASUREMENTS_PAGE.listLabel}
              className="flex flex-col gap-2 md:hidden"
            >
              {measurements.map((m) => {
                const severity = topMeasurementSeverity(m);
                const isSelected = selectedMeasurement?.id === m.id;
                return (
                  <div
                    key={m.id}
                    role="listitem"
                    onClick={() => openEvolution(m)}
                    className={`flex flex-col gap-2 rounded-lg border border-border p-3 ${CARD_HOVER_CLASS} ${rowStateClass(isSelected, severity ? SEVERITY_ROW_CLASS[severity] : undefined)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">
                        {m.subject.name} {m.subject.last_name}
                        <span className="text-muted-foreground">
                          {" "}
                          ({m.subject.dni})
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                        {formatTimestampDate(m.measured_at)}
                        <RowChevron />
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">
                          {m.weight_kg}
                        </span>{" "}
                        kg
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {m.height_cm}
                        </span>{" "}
                        cm
                      </span>
                      <span>
                        IMC{" "}
                        <span className="font-medium text-foreground">
                          {m.bmi}
                        </span>
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {m.establishment.name} · {m.responsible.name}{" "}
                      {m.responsible.last_name}
                    </div>

                    <div className="w-fit">
                      <MeasurementAssessmentList
                        alerts={m.alerts}
                        assessments={m.assessments}
                      />
                    </div>

                    <div className="flex min-w-0 flex-col gap-1 text-xs">
                      <span className="text-muted-foreground">
                        {MEASUREMENTS_PAGE.columns.observation}
                      </span>
                      <MeasurementObservation observation={m.observation} />
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* Evolution panel (CA4) */}
      <Dialog.Root
        open={!!selectedMeasurement}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeDetail();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn("fixed inset-0 z-40", OVERLAY_CLASS)}
          />
          <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <Dialog.Title className="text-xl font-bold tracking-tight">
                {selectedMeasurement
                  ? `${selectedMeasurement.subject.name} ${selectedMeasurement.subject.last_name}`
                  : MEASUREMENTS_PAGE.evolutionDefaultTitle}
              </Dialog.Title>
              <Dialog.Close
                render={<button type="button" />}
                className="text-muted-foreground hover:text-foreground mt-0.5"
              >
                <X size={18} />
              </Dialog.Close>
            </div>

            <Separator />

            {selectedMeasurement && (
              <section
                aria-label={MEASUREMENTS_PAGE.detail.selectedMeasurement}
                className="flex flex-col gap-2"
              >
                <h2 className="text-sm font-medium">
                  {MEASUREMENTS_PAGE.detail.selectedMeasurement}
                </h2>
                <time
                  className="text-sm"
                  dateTime={selectedMeasurement.measured_at}
                >
                  {formatTimestamp(selectedMeasurement.measured_at)}
                </time>
                <div className="grid grid-cols-3 gap-2">
                  <DetailField
                    label={MEASUREMENTS_PAGE.columns.weight}
                    value={selectedMeasurement.weight_kg}
                  />
                  <DetailField
                    label={MEASUREMENTS_PAGE.columns.height}
                    value={selectedMeasurement.height_cm}
                  />
                  <DetailField
                    label={MEASUREMENTS_PAGE.columns.bmi}
                    value={selectedMeasurement.bmi}
                  />
                </div>
                <MeasurementAssessmentList
                  alerts={selectedMeasurement.alerts}
                  assessments={selectedMeasurement.assessments}
                />
                {selectedMeasurement.observation?.trim() && (
                  <MeasurementObservation
                    observation={selectedMeasurement.observation}
                    compact={false}
                  />
                )}
              </section>
            )}

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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField
                    label={MEASUREMENTS_PAGE.detail.dni}
                    value={evolution.subject.dni}
                  />
                  <DetailField
                    label={MEASUREMENTS_PAGE.detail.sex}
                    value={
                      evolution.subject.sex === "male"
                        ? MEASUREMENTS_PAGE.detail.sexMale
                        : MEASUREMENTS_PAGE.detail.sexFemale
                    }
                  />
                  <DetailField
                    label={MEASUREMENTS_PAGE.detail.birthDate}
                    value={formatDate(evolution.subject.birth_date)}
                  />
                  <DetailField
                    label={MEASUREMENTS_PAGE.detail.age}
                    value={formatAgeMonths(
                      ageInMonths(
                        evolution.subject.birth_date,
                        argentineToday(now),
                      ),
                    )}
                  />
                  <DetailField
                    label={MEASUREMENTS_PAGE.detail.measurementsCount}
                    value={evolution.points.length}
                  />
                </div>

                <Separator />

                <section
                  aria-label={MEASUREMENTS_PAGE.detail.chartTitle}
                  className="flex flex-col gap-2"
                >
                  <span className="text-sm font-medium">
                    {MEASUREMENTS_PAGE.detail.chartTitle}
                  </span>
                  <MeasurementEvolutionChart points={evolution.points} />
                </section>

                {evolution.points.some(
                  ({ assessments }) => assessments != null,
                ) && (
                  <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-medium">
                      {MEASUREMENTS_PAGE.detail.assessmentsTitle}
                    </h2>
                    <ol className="space-y-3">
                      {evolution.points.map((point, index) => (
                        <li
                          key={point.id ?? `${point.measured_at}-${index}`}
                          className="space-y-1"
                        >
                          <time
                            className="text-xs text-muted-foreground"
                            dateTime={point.measured_at}
                          >
                            {formatTimestamp(point.measured_at)}
                          </time>
                          <MeasurementAssessmentList
                            alerts={point.alerts}
                            assessments={point.assessments}
                          />
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                <section
                  aria-label={MEASUREMENTS_PAGE.detail.observationsTitle}
                  className="flex flex-col gap-3"
                >
                  <h2 className="text-sm font-medium">
                    {MEASUREMENTS_PAGE.detail.observationsTitle}
                  </h2>
                  {evolution.points.some((point) =>
                    point.observation?.trim(),
                  ) ? (
                    evolution.points
                      .filter((point) => point.observation?.trim())
                      .map((point, index) => (
                        <div
                          key={point.id ?? `${point.measured_at}-${index}`}
                          className="flex min-w-0 flex-col gap-1 text-sm"
                        >
                          <span className="text-xs text-muted-foreground">
                            {formatTimestampDate(point.measured_at)}
                          </span>
                          <MeasurementObservation
                            observation={point.observation}
                            compact={false}
                          />
                        </div>
                      ))
                  ) : (
                    <MeasurementObservation
                      observation={null}
                      compact={false}
                    />
                  )}
                </section>
              </div>
            ) : null}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
