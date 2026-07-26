"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getSurveyAction,
  listSurveyResponsesAction,
  exportSurveyResponsesAction,
} from "@/services/survey.service";
import { listEstablishmentsAction } from "@/services/establishment.service";
import { SurveyResponseDashboardItem, SurveyResponse } from "@/types/survey";
import { EstablishmentResponse } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { RESPUESTAS_PAGE } from "@/constants/surveys";
import ResponseDetailPanel from "./ResponseDetailPanel";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Filters = {
  establishmentId: string;
  dateFrom: string;
  dateTo: string;
  city: string;
  province: string;
};

const EMPTY_FILTERS: Filters = {
  establishmentId: "",
  dateFrom: "",
  dateTo: "",
  city: "",
  province: "",
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export default function RespuestasPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;
  const { makeAuthorizedRequest } = useAuth();

  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [responses, setResponses] = useState<SurveyResponseDashboardItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] =
    useState<Filters>(EMPTY_FILTERS);

  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>(
    [],
  );

  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null,
  );

  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch survey metadata
  useEffect(() => {
    getSurveyAction(makeAuthorizedRequest, surveyId)
      .then(setSurvey)
      .catch(() => {});
  }, [makeAuthorizedRequest, surveyId]);

  // Fetch establishments for filter dropdown
  useEffect(() => {
    listEstablishmentsAction(makeAuthorizedRequest, {
      page: 1,
      page_size: 100,
    })
      .then((data) => setEstablishments(data.items))
      .catch(() => {});
  }, [makeAuthorizedRequest]);

  // Debounce filter changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [filters]);

  const fetchResponses = useCallback(
    async (currentPage: number, currentFilters: Filters) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listSurveyResponsesAction(makeAuthorizedRequest, {
          survey_id: surveyId,
          page: currentPage,
          page_size: PAGE_SIZE,
          establishment_id: currentFilters.establishmentId || undefined,
          event_at_from: currentFilters.dateFrom
            ? `${currentFilters.dateFrom}T00:00:00Z`
            : undefined,
          event_at_to: currentFilters.dateTo
            ? `${currentFilters.dateTo}T23:59:59Z`
            : undefined,
          city: currentFilters.city || undefined,
          province: currentFilters.province || undefined,
        });
        setResponses(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setResponses([]);
        setError(
          err instanceof Error ? err.message : "Error al cargar las respuestas",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, surveyId],
  );

  useEffect(() => {
    fetchResponses(page, debouncedFilters);
  }, [fetchResponses, page, debouncedFilters, reloadKey]);

  // Refresh on tab focus
  useEffect(() => {
    const onFocus = () => setReloadKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportSurveyResponsesAction(makeAuthorizedRequest, {
        survey_id: surveyId,
        establishment_id: filters.establishmentId || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `respuestas-${survey?.name ?? surveyId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar:", err);
    } finally {
      setExporting(false);
    }
  }

  const closeDetail = () => {
    setSelectedResponseId(null);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 min-w-0 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push("/dashboard/encuestas")}
              >
                <ArrowLeft size={16} />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">
                {RESPUESTAS_PAGE.title}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm ml-8">
              {survey ? survey.name : RESPUESTAS_PAGE.subtitle}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            disabled={exporting || responses.length === 0}
            onClick={handleExport}
          >
            {exporting ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Download size={14} />
            )}
            {exporting ? RESPUESTAS_PAGE.exporting : RESPUESTAS_PAGE.export}
          </Button>
        </div>

        <Separator />

        {/* Filters (CA5) */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {RESPUESTAS_PAGE.filters.establishment}
            </label>
            <select
              value={filters.establishmentId}
              onChange={(e) => updateFilter("establishmentId", e.target.value)}
              className={`${SELECT_CLASS} w-full sm:w-56`}
            >
              <option value="">
                {RESPUESTAS_PAGE.filters.allEstablishments}
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
              {RESPUESTAS_PAGE.filters.dateFrom}
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className="w-full sm:w-40"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {RESPUESTAS_PAGE.filters.dateTo}
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="w-full sm:w-40"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {RESPUESTAS_PAGE.filters.city}
            </label>
            <Input
              value={filters.city}
              onChange={(e) => updateFilter("city", e.target.value)}
              placeholder="Ciudad"
              className="w-full sm:w-40"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {RESPUESTAS_PAGE.filters.province}
            </label>
            <Input
              value={filters.province}
              onChange={(e) => updateFilter("province", e.target.value)}
              placeholder="Provincia"
              className="w-full sm:w-40"
            />
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
        ) : responses.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {RESPUESTAS_PAGE.noResponses}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {RESPUESTAS_PAGE.columns.respondent}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {RESPUESTAS_PAGE.columns.establishment}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {RESPUESTAS_PAGE.columns.city}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {RESPUESTAS_PAGE.columns.province}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {RESPUESTAS_PAGE.columns.date}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {RESPUESTAS_PAGE.columns.score}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {responses.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedResponseId(item.id)}
                      className={`cursor-pointer bg-card transition-colors hover:bg-muted/30 ${
                        selectedResponseId === item.id ? "bg-muted/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {item.submitted_by.name}
                      </td>
                      <td className="px-4 py-3">{item.establishment.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.establishment.city || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.establishment.province || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(item.event_at)}
                      </td>
                      <td className="px-4 py-3">
                        {item.score_fies !== null ? (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {item.score_fies}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-2 md:hidden">
              {responses.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedResponseId(item.id)}
                  className={`flex flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30 ${
                    selectedResponseId === item.id ? "bg-muted/40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">
                      {item.submitted_by.name}
                    </span>
                    {item.score_fies !== null && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        FIES {item.score_fies}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.establishment.name} · {item.establishment.city},{" "}
                    {item.establishment.province}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.event_at)}
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
                <span>{RESPUESTAS_PAGE.pagination(page, totalPages)}</span>
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

      {/* Detail panel (CA3) */}
      <ResponseDetailPanel
        responseId={selectedResponseId}
        onClose={closeDetail}
      />
    </div>
  );
}
