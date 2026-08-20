"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getSurveyAction,
  listSurveyResponsesAction,
  exportSurveyResponsesAction,
} from "@/services/survey.service";
import {
  SurveyResponseDashboardItem,
  SurveyResponse,
  SurveyResponseSortOrder,
} from "@/types/survey";
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
import {
  RESPONSE_SORT_LABELS,
  RESPONSE_TARGET_DESCRIPTIONS,
  RESPONSE_TARGET_LABELS,
  RESPONSES_PAGE,
} from "@/constants/surveys";
import ResponseEntity, {
  entityLabel,
} from "@/components/surveys/ResponseEntity";
import { EMPTY_VALUE } from "@/lib/format";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowChevron,
  RowLink,
  ROW_HOVER_CLASS,
  rowStateClass,
} from "@/components/listings/RowAffordance";
import ResponseDetailPanel from "./ResponseDetailPanel";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Only event_at is shown in the table, so only event_at can be ordered by:
 *  sorting on a column the reader cannot see reads as an arbitrary shuffle. */
const SORT_OPTIONS = Object.entries(RESPONSE_SORT_LABELS) as [
  SurveyResponseSortOrder,
  string,
][];

type Filters = {
  dateFrom: string;
  dateTo: string;
  city: string;
  province: string;
};

const EMPTY_FILTERS: Filters = {
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

export default function ResponsesPage() {
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

  const [sortOrder, setSortOrder] =
    useState<SurveyResponseSortOrder>("event_at_desc");

  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null,
  );

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch survey metadata
  useEffect(() => {
    getSurveyAction(makeAuthorizedRequest, surveyId)
      .then(setSurvey)
      .catch(() => {});
  }, [makeAuthorizedRequest, surveyId]);

  // Debounce filter changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [filters]);

  const fetchResponses = useCallback(
    async (
      currentPage: number,
      currentFilters: Filters,
      currentSort: SurveyResponseSortOrder,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listSurveyResponsesAction(makeAuthorizedRequest, {
          survey_id: surveyId,
          page: currentPage,
          page_size: PAGE_SIZE,
          event_at_from: currentFilters.dateFrom
            ? `${currentFilters.dateFrom}T00:00:00Z`
            : undefined,
          event_at_to: currentFilters.dateTo
            ? `${currentFilters.dateTo}T23:59:59Z`
            : undefined,
          city: currentFilters.city || undefined,
          province: currentFilters.province || undefined,
          sort_order: currentSort,
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
    fetchResponses(page, debouncedFilters, sortOrder);
  }, [fetchResponses, page, debouncedFilters, sortOrder, reloadKey]);

  // Refresh on tab focus
  useEffect(() => {
    const onFocus = () => setReloadKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const isEstablishmentTargeted = survey?.response_target === "establishment";

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const blob = await exportSurveyResponsesAction({ survey_id: surveyId });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `respuestas-${survey?.name ?? surveyId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : RESPONSES_PAGE.exportError,
      );
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
                onClick={() => router.push("/dashboard/surveys")}
              >
                <ArrowLeft size={16} />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">
                {RESPONSES_PAGE.title}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm ml-8">
              {survey ? survey.name : RESPONSES_PAGE.subtitle}
            </p>
            {/* The target explains both what the entity column holds and why
                the location filters are or aren't offered (CA5, CA6). */}
            {survey && (
              <div className="ml-8 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {RESPONSES_PAGE.targetPrefix}{" "}
                  {RESPONSE_TARGET_LABELS[survey.response_target]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {RESPONSE_TARGET_DESCRIPTIONS[survey.response_target]}
                </span>
              </div>
            )}
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
            {exporting ? RESPONSES_PAGE.exporting : RESPONSES_PAGE.export}
          </Button>
        </div>

        <Separator />

        {/* Filters  */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {RESPONSES_PAGE.filters.dateFrom}
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
              {RESPONSES_PAGE.filters.dateTo}
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="w-full sm:w-40"
            />
          </div>

          {/* Location lives on the establishment, so these filters only exist
              for establishment-targeted surveys — the API answers 400 for the
              other targets rather than returning an empty page (CA6). */}
          {isEstablishmentTargeted && (
            <>
              <div className="flex w-full flex-col gap-1 sm:w-auto">
                <label className="text-xs text-muted-foreground">
                  {RESPONSES_PAGE.filters.city}
                </label>
                <Input
                  value={filters.city}
                  onChange={(e) => updateFilter("city", e.target.value)}
                  placeholder={RESPONSES_PAGE.filters.city}
                  className="w-full sm:w-40"
                />
              </div>

              <div className="flex w-full flex-col gap-1 sm:w-auto">
                <label className="text-xs text-muted-foreground">
                  {RESPONSES_PAGE.filters.province}
                </label>
                <Input
                  value={filters.province}
                  onChange={(e) => updateFilter("province", e.target.value)}
                  placeholder={RESPONSES_PAGE.filters.province}
                  className="w-full sm:w-40"
                />
              </div>
            </>
          )}

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {RESPONSES_PAGE.filters.sort}
            </label>
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as SurveyResponseSortOrder)
              }
              className={`${SELECT_CLASS} w-full sm:w-52`}
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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

        {/* Kept separate from the listing error so a failed export neither
            replaces the table's own message nor is replaced by it (CA9). */}
        {exportError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {RESPONSES_PAGE.exportError}: {exportError}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : responses.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {RESPONSES_PAGE.noResponses}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {RESPONSES_PAGE.columns.entity}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {RESPONSES_PAGE.columns.respondent}
                    </th>
                    {isEstablishmentTargeted && (
                      <>
                        <th className="px-4 py-3 font-medium">
                          {RESPONSES_PAGE.columns.city}
                        </th>
                        <th className="px-4 py-3 font-medium">
                          {RESPONSES_PAGE.columns.province}
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 font-medium">
                      {RESPONSES_PAGE.columns.date}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {RESPONSES_PAGE.columns.score}
                    </th>
                    <ChevronHeaderCell />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {responses.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedResponseId(item.id)}
                      className={`${ROW_HOVER_CLASS} ${rowStateClass(
                        selectedResponseId === item.id,
                      )}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <RowLink>
                          <ResponseEntity
                            subject={item.subject}
                            establishment={item.establishment}
                          />
                        </RowLink>
                      </td>
                      <td className="px-4 py-3">
                        {item.submitted_by.name} {item.submitted_by.last_name}
                      </td>
                      {isEstablishmentTargeted && (
                        <>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.establishment?.city || EMPTY_VALUE}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.establishment?.province || EMPTY_VALUE}
                          </td>
                        </>
                      )}
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
                      <ChevronCell />
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
                  className={`flex flex-col gap-1 rounded-lg border border-border p-3 text-left ${CARD_HOVER_CLASS} ${rowStateClass(
                    selectedResponseId === item.id,
                  )}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <RowLink>
                      <span className="text-sm font-medium">
                        {entityLabel({
                          subject: item.subject,
                          establishment: item.establishment,
                        })}
                      </span>
                    </RowLink>
                    {item.score_fies !== null && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        FIES {item.score_fies}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.establishment
                      ? `${item.establishment.name} · ${item.establishment.city}, ${item.establishment.province}`
                      : `${item.submitted_by.name} ${item.submitted_by.last_name}`}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.event_at)}
                    </span>
                    <RowChevron />
                  </div>
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
                <span>{RESPONSES_PAGE.pagination(page, totalPages)}</span>
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

      <ResponseDetailPanel
        surveyId={surveyId}
        responseId={selectedResponseId}
        onClose={closeDetail}
      />
    </div>
  );
}
