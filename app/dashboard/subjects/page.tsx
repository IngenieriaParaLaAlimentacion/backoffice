"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  exportSubjectsAction,
  listSubjectsAction,
  SubjectFilters,
} from "@/services/subject.service";
import { listEstablishmentsAction } from "@/services/establishment.service";
import { SubjectSortOrder, SubjectSummary } from "@/types/subject";
import { EstablishmentResponse } from "@/types/establishment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import ExportButton from "@/components/listings/ExportButton";
import ExportError from "@/components/listings/ExportError";
import SubjectDetailPanel from "@/components/subjects/SubjectDetailPanel";
import { useCsvExport } from "@/hooks/useCsvExport";
import { EXPORT, EXPORT_FILENAMES } from "@/constants/exports";
import { formatDate, formatTimestampDate, EMPTY_VALUE } from "@/lib/format";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowChevron,
  RowLink,
  ROW_HOVER_CLASS,
  rowStateClass,
} from "@/components/listings/RowAffordance";
import {
  FilterPanel,
  FiltersToggle,
} from "@/components/listings/FiltersToggle";
import { Loader2, RefreshCw, Search } from "lucide-react";
import {
  SUBJECT_INDIGENOUS_FILTER_LABELS,
  SUBJECT_RURAL_FILTER_LABELS,
  SUBJECT_SEX_FILTER_LABELS,
  SUBJECT_SORT_LABELS,
  SUBJECTS_PAGE,
} from "@/constants/subjects";
import { getErrorMessage } from "@/lib/errorMessages";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;
const ESTABLISHMENTS_PAGE_SIZE = 100;

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SORT_OPTIONS: { value: SubjectSortOrder; label: string }[] = (
  Object.keys(SUBJECT_SORT_LABELS) as SubjectSortOrder[]
).map((value) => ({ value, label: SUBJECT_SORT_LABELS[value] }));

const RURAL_OPTIONS: { value: "" | "true" | "false"; label: string }[] = (
  Object.keys(SUBJECT_RURAL_FILTER_LABELS) as ("" | "true" | "false")[]
).map((value) => ({ value, label: SUBJECT_RURAL_FILTER_LABELS[value] }));

const INDIGENOUS_OPTIONS: { value: "" | "true" | "false"; label: string }[] = (
  Object.keys(SUBJECT_INDIGENOUS_FILTER_LABELS) as ("" | "true" | "false")[]
).map((value) => ({ value, label: SUBJECT_INDIGENOUS_FILTER_LABELS[value] }));

const SEX_OPTIONS: { value: "" | "female" | "male"; label: string }[] = (
  Object.keys(SUBJECT_SEX_FILTER_LABELS) as ("" | "female" | "male")[]
).map((value) => ({ value, label: SUBJECT_SEX_FILTER_LABELS[value] }));

type Filters = {
  search: string;
  birthDateFrom: string;
  birthDateTo: string;
  establishmentId: string;
  isRural: "" | "true" | "false";
  isIndigenous: "" | "true" | "false";
  sex: "" | "female" | "male";
};

const EMPTY_FILTERS: Filters = {
  search: "",
  birthDateFrom: "",
  birthDateTo: "",
  establishmentId: "",
  isRural: "",
  isIndigenous: "",
  sex: "",
};

/** Maps the page's string-valued filters onto the API's query params. */
function toSubjectFilters(
  filters: Filters,
  sortOrder: SubjectSortOrder,
): SubjectFilters {
  return {
    search: filters.search || undefined,
    birth_date_from: filters.birthDateFrom || undefined,
    birth_date_to: filters.birthDateTo || undefined,
    establishment_id: filters.establishmentId || undefined,
    is_rural: filters.isRural === "" ? undefined : filters.isRural === "true",
    is_indigenous:
      filters.isIndigenous === "" ? undefined : filters.isIndigenous === "true",
    sex: filters.sex || undefined,
    sort_order: sortOrder,
  };
}

export default function SubjectsPage() {
  const { makeAuthorizedRequest, makeAuthorizedDownload } = useAuth();

  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] =
    useState<Filters>(EMPTY_FILTERS);

  const [sortOrder, setSortOrder] = useState<SubjectSortOrder>("name_asc");

  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>(
    [],
  );

  const [reloadKey, setReloadKey] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    isExporting,
    error: exportError,
    clearError: clearExportError,
    runExport,
  } = useCsvExport();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    filters.birthDateFrom,
    filters.birthDateTo,
    filters.establishmentId,
    filters.isRural,
    filters.isIndigenous,
    filters.sex,
  ].filter(Boolean).length;
  const hasActiveFilters =
    activeFilterCount > 0 || filters.search !== EMPTY_FILTERS.search;

  // Debounce filter changes and reset to the first page when they change.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [filters]);

  // Populate the "Establecimiento" filter once on mount.
  useEffect(() => {
    listEstablishmentsAction(makeAuthorizedRequest, {
      page: 1,
      page_size: ESTABLISHMENTS_PAGE_SIZE,
    })
      .then((data) => setEstablishments(data.items))
      .catch(() => setEstablishments([]));
  }, [makeAuthorizedRequest]);

  const fetchSubjects = useCallback(
    async (
      currentPage: number,
      currentFilters: Filters,
      currentSortOrder: SubjectSortOrder,
    ) => {
      // Guard an inconsistent range client-side (backend returns 400 otherwise).
      if (
        currentFilters.birthDateFrom &&
        currentFilters.birthDateTo &&
        currentFilters.birthDateFrom > currentFilters.birthDateTo
      ) {
        setSubjects([]);
        setError(SUBJECTS_PAGE.measuredFromAfterToError);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await listSubjectsAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: PAGE_SIZE,
          ...toSubjectFilters(currentFilters, currentSortOrder),
        });
        setSubjects(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(getErrorMessage(err, { fallback: SUBJECTS_PAGE.loadError }));
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchSubjects(page, debouncedFilters, sortOrder);
  }, [fetchSubjects, page, debouncedFilters, sortOrder, reloadKey]);

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
    () => toSubjectFilters(debouncedFilters, sortOrder),
    [debouncedFilters, sortOrder],
  );

  const handleExport = () =>
    runExport(
      () => exportSubjectsAction(makeAuthorizedDownload, exportFilters),
      EXPORT_FILENAMES.subjects,
    );

  const closeDetail = () => {
    setSelectedId(null);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{SUBJECTS_PAGE.title}</h1>
            <p className="text-muted-foreground text-sm">
              {SUBJECTS_PAGE.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <ExportButton
              isExporting={isExporting}
              onClick={handleExport}
              disabled={isLoading || total === 0}
              emptyHint={total === 0 ? EXPORT.empty : undefined}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <RefreshCw size={14} />
              {SUBJECTS_PAGE.refresh}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Search + sort (always visible) and collapsible filters (CA2) */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {SUBJECTS_PAGE.search}
              </label>
              <div className="relative w-full sm:w-64">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={16}
                />
                <Input
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  placeholder={SUBJECTS_PAGE.searchPlaceholder}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {SUBJECTS_PAGE.sortLabel}
              </label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as SubjectSortOrder);
                  setPage(1);
                }}
                className={`${SELECT_CLASS} w-full sm:w-56`}
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
                {SUBJECTS_PAGE.filters.birthDate}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {SUBJECTS_PAGE.filters.from}
                  </span>
                  <Input
                    type="date"
                    value={filters.birthDateFrom}
                    onChange={(e) =>
                      updateFilter("birthDateFrom", e.target.value)
                    }
                    className="w-full sm:w-36"
                  />
                </div>
                <span className="mt-3 text-muted-foreground">–</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {SUBJECTS_PAGE.filters.to}
                  </span>
                  <Input
                    type="date"
                    value={filters.birthDateTo}
                    onChange={(e) =>
                      updateFilter("birthDateTo", e.target.value)
                    }
                    className="w-full sm:w-36"
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {SUBJECTS_PAGE.filters.establishment}
              </label>
              <select
                value={filters.establishmentId}
                onChange={(e) =>
                  updateFilter("establishmentId", e.target.value)
                }
                className={`${SELECT_CLASS} w-full sm:w-48`}
              >
                <option value="">
                  {SUBJECTS_PAGE.filters.allEstablishments}
                </option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {SUBJECTS_PAGE.filters.rural}
              </label>
              <select
                value={filters.isRural}
                onChange={(e) =>
                  updateFilter("isRural", e.target.value as Filters["isRural"])
                }
                className={`${SELECT_CLASS} w-full sm:w-32`}
              >
                {RURAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {SUBJECTS_PAGE.filters.indigenous}
              </label>
              <select
                value={filters.isIndigenous}
                onChange={(e) =>
                  updateFilter(
                    "isIndigenous",
                    e.target.value as Filters["isIndigenous"],
                  )
                }
                className={`${SELECT_CLASS} w-full sm:w-32`}
              >
                {INDIGENOUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                {SUBJECTS_PAGE.filters.sex}
              </label>
              <select
                value={filters.sex}
                onChange={(e) =>
                  updateFilter("sex", e.target.value as Filters["sex"])
                }
                className={`${SELECT_CLASS} w-full sm:w-32`}
              >
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
        ) : subjects.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {SUBJECTS_PAGE.noSubjects}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {SUBJECTS_PAGE.columns.name}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {SUBJECTS_PAGE.columns.document}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {SUBJECTS_PAGE.columns.birthDate}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {SUBJECTS_PAGE.columns.lastMeasurement}
                    </th>
                    <ChevronHeaderCell />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjects.map((subject) => (
                    <tr
                      key={subject.id}
                      onClick={() => setSelectedId(subject.id)}
                      className={`${ROW_HOVER_CLASS} ${rowStateClass(selectedId === subject.id)}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <RowLink>
                          {subject.name} {subject.last_name}
                        </RowLink>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {subject.dni}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(subject.birth_date)}
                      </td>
                      <td className="px-4 py-3">
                        {subject.latest_measurement?.measured_at ? (
                          formatTimestampDate(
                            subject.latest_measurement.measured_at,
                          )
                        ) : (
                          <span className="text-muted-foreground">
                            {EMPTY_VALUE}
                          </span>
                        )}
                      </td>
                      <ChevronCell />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedId(subject.id)}
                  className={`flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-left ${CARD_HOVER_CLASS} ${rowStateClass(selectedId === subject.id)}`}
                >
                  <span className="flex flex-col gap-1">
                    <RowLink>
                      <span className="text-sm font-medium">
                        {subject.name} {subject.last_name}
                      </span>
                    </RowLink>
                    <span className="text-xs text-muted-foreground">
                      {subject.dni}
                    </span>
                  </span>
                  <RowChevron className="shrink-0" />
                </button>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* Detail panel (CA4). No scoped alerts are passed here: the panel reads
          the subject's global latest measurement from GET /subjects/{id}. */}
      <SubjectDetailPanel subjectId={selectedId} onClose={closeDetail} />
    </div>
  );
}
