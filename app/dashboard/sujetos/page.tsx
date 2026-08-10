"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listSubjectsAction } from "@/services/subject.service";
import { listEstablishmentsAction } from "@/services/establishment.service";
import { SubjectSortOrder, SubjectSummary } from "@/types/subject";
import { EstablishmentResponse } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import SubjectDetailPanel from "@/components/subjects/SubjectDetailPanel";
import { formatDate, formatDateTime, EMPTY_VALUE } from "@/lib/format";
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
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;
const ESTABLISHMENTS_PAGE_SIZE = 100;

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SORT_OPTIONS: { value: SubjectSortOrder; label: string }[] = [
  { value: "name_asc", label: "Nombre A → Z" },
  { value: "name_desc", label: "Nombre Z → A" },
  { value: "birth_date_asc", label: "Fecha de nacimiento (más antigua)" },
  { value: "birth_date_desc", label: "Fecha de nacimiento (más reciente)" },
];

const RURAL_OPTIONS: { value: "" | "true" | "false"; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "true", label: "Rural" },
  { value: "false", label: "No rural" },
];

const INDIGENOUS_OPTIONS: { value: "" | "true" | "false"; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "true", label: "Sí" },
  { value: "false", label: "No" },
];

const SEX_OPTIONS: { value: "" | "female" | "male"; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "female", label: "Femenino" },
  { value: "male", label: "Masculino" },
];

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

export default function SujetosPage() {
  const { makeAuthorizedRequest } = useAuth();

  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [page, setPage] = useState(1);
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
        setError("La fecha desde no puede ser posterior a la fecha hasta.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await listSubjectsAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: PAGE_SIZE,
          search: currentFilters.search || undefined,
          birth_date_from: currentFilters.birthDateFrom || undefined,
          birth_date_to: currentFilters.birthDateTo || undefined,
          establishment_id: currentFilters.establishmentId || undefined,
          is_rural:
            currentFilters.isRural === ""
              ? undefined
              : currentFilters.isRural === "true",
          is_indigenous:
            currentFilters.isIndigenous === ""
              ? undefined
              : currentFilters.isIndigenous === "true",
          sex: currentFilters.sex || undefined,
          sort_order: currentSortOrder,
        });
        setSubjects(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar sujetos",
        );
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

  const closeDetail = () => {
    setSelectedId(null);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Sujetos</h1>
            <p className="text-muted-foreground text-sm">Sujetos registrados</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            <RefreshCw size={14} />
            Actualizar
          </Button>
        </div>

        <Separator />

        {/* Search + sort (always visible) and collapsible filters (CA2) */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">Buscar</label>
              <div className="relative w-full sm:w-64">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={16}
                />
                <Input
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  placeholder="Nombre, apellido o documento"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label className="text-xs text-muted-foreground">
                Ordenar por
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

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontal size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                <X size={14} />
                Borrar filtros
              </Button>
            )}
          </div>

          {filtersOpen && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex w-full flex-col gap-1 sm:w-auto">
                <label className="text-xs text-muted-foreground">
                  Fecha de nacimiento
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      Desde
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
                      Hasta
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
                  Establecimiento
                </label>
                <select
                  value={filters.establishmentId}
                  onChange={(e) =>
                    updateFilter("establishmentId", e.target.value)
                  }
                  className={`${SELECT_CLASS} w-full sm:w-48`}
                >
                  <option value="">Todos</option>
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full flex-col gap-1 sm:w-auto">
                <label className="text-xs text-muted-foreground">
                  Zona rural
                </label>
                <select
                  value={filters.isRural}
                  onChange={(e) =>
                    updateFilter(
                      "isRural",
                      e.target.value as Filters["isRural"],
                    )
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
                  Población indígena
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
                <label className="text-xs text-muted-foreground">Sexo</label>
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
            </div>
          )}
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
        ) : subjects.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            No hay sujetos
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Documento</th>
                    <th className="px-4 py-3 font-medium">
                      Fecha de nacimiento
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Último relevamiento
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
                          formatDateTime(subject.latest_measurement.measured_at)
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
