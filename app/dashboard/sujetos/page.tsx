"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  getSubjectAction,
  listSubjectsAction,
} from "@/services/subject.service";
import {
  SortOrder,
  SubjectDetail,
  SubjectSortField,
  SubjectSummary,
} from "@/types/subject";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

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

// "YYYY-MM-DD" -> "DD/MM/YYYY" without timezone shifts.
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
  const [detail, setDetail] = useState<SubjectDetail | null>(null);
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

  const openDetail = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setDetail(null);
      setDetailError(null);
      setDetailLoading(true);
      try {
        const data = await getSubjectAction(makeAuthorizedRequest, id);
        setDetail(data);
      } catch (err) {
        setDetailError(
          err instanceof Error ? err.message : "Error al cargar el sujeto",
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
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
                      onClick={() => openDetail(subject.id)}
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
                  onClick={() => openDetail(subject.id)}
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

      {/* Detail panel (CA4) */}
      <Dialog.Root
        open={!!selectedId}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeDetail();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <Dialog.Title className="text-xl font-bold tracking-tight">
                {detail ? `${detail.name} ${detail.last_name}` : "Sujeto"}
              </Dialog.Title>
              <Dialog.Close
                render={<button type="button" />}
                className="text-muted-foreground hover:text-foreground mt-0.5"
              >
                <X size={18} />
              </Dialog.Close>
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
            ) : detail ? (
              <div className="flex flex-col gap-4">
                <DetailField label="Documento de identidad" value={detail.dni} />
                <DetailField
                  label="Sexo"
                  value={detail.sex === "male" ? "Masculino" : "Femenino"}
                />
                <DetailField
                  label="Fecha de nacimiento"
                  value={formatDate(detail.birth_date)}
                />
                <DetailField
                  label="Población rural"
                  value={detail.is_rural ? "Sí" : "No"}
                />
                <DetailField
                  label="Población indígena"
                  value={detail.is_indigenous ? "Sí" : "No"}
                />
                <DetailField
                  label="Fecha de último relevamiento"
                  value={<span className="text-muted-foreground">—</span>}
                />
              </div>
            ) : null}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
