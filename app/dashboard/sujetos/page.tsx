"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listSubjectsAction } from "@/services/subject.service";
import { SortOrder, SubjectSortField, SubjectSummary } from "@/types/subject";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import SubjectDetailPanel from "@/components/subjects/SubjectDetailPanel";
import { ArrowDown, ArrowUp, Loader2, RefreshCw, Search } from "lucide-react";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SORT_OPTIONS: { value: SubjectSortField; label: string }[] = [
  { value: "name", label: "Nombre y apellido" },
  { value: "created_at", label: "Fecha de creación" },
  { value: "last_survey_date", label: "Fecha de último relevamiento" },
];

type Filters = {
  search: string;
  birthDate: string;
  lastSurveyDate: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  birthDate: "",
  lastSurveyDate: "",
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

  const [sortBy, setSortBy] = useState<SubjectSortField>("name");
  const [order, setOrder] = useState<SortOrder>("asc");

  const [reloadKey, setReloadKey] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce filter changes and reset to the first page when they change.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [filters]);

  const fetchSubjects = useCallback(
    async (
      currentPage: number,
      currentFilters: Filters,
      currentSortBy: SubjectSortField,
      currentOrder: SortOrder,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listSubjectsAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: PAGE_SIZE,
          search: currentFilters.search || undefined,
          birth_date: currentFilters.birthDate || undefined,
          last_survey_date: currentFilters.lastSurveyDate || undefined,
          sort_by: currentSortBy,
          order: currentOrder,
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
    fetchSubjects(page, debouncedFilters, sortBy, order);
  }, [fetchSubjects, page, debouncedFilters, sortBy, order, reloadKey]);

  // Reflect changes made elsewhere when the user returns to the tab.
  useEffect(() => {
    const onFocus = () => setReloadKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const updateFilter = (key: keyof Filters, value: string) => {
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

        {/* Filters (CA2) + sorting (CA3) */}
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
              Fecha de nacimiento
            </label>
            <Input
              type="date"
              value={filters.birthDate}
              onChange={(e) => updateFilter("birthDate", e.target.value)}
              className="w-full sm:w-40"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              Último relevamiento
            </label>
            <Input
              type="date"
              value={filters.lastSurveyDate}
              onChange={(e) => updateFilter("lastSurveyDate", e.target.value)}
              className="w-full sm:w-40"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">Ordenar por</label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SubjectSortField);
                  setPage(1);
                }}
                className={`${SELECT_CLASS} flex-1 sm:w-56 sm:flex-none`}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setOrder((o) => (o === "asc" ? "desc" : "asc"));
                  setPage(1);
                }}
                title={order === "asc" ? "Ascendente" : "Descendente"}
              >
                {order === "asc" ? (
                  <ArrowUp size={14} />
                ) : (
                  <ArrowDown size={14} />
                )}
              </Button>
            </div>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjects.map((subject) => (
                    <tr
                      key={subject.id}
                      onClick={() => setSelectedId(subject.id)}
                      className={`cursor-pointer bg-card transition-colors hover:bg-muted/30 ${
                        selectedId === subject.id ? "bg-muted/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {subject.name} {subject.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {subject.dni}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">—</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">—</span>
                      </td>
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
                  className={`flex flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30 ${
                    selectedId === subject.id ? "bg-muted/40" : ""
                  }`}
                >
                  <span className="text-sm font-medium">
                    {subject.name} {subject.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {subject.dni}
                  </span>
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
