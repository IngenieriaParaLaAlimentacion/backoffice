"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  SURVEYS_PAGE,
  SURVEY_FORM,
  SURVEY_STATUS_TONE,
  RESPONSE_TARGET_LABELS,
} from "@/constants/surveys";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowLink,
  ROW_HOVER_CLASS,
} from "@/components/listings/RowAffordance";
import { RESPONSE_TARGETS } from "@/schemas/survey.schema";
import { ResponseTargetFilter, useSurveys } from "@/hooks/useSurveys";
import { useAuth } from "@/context/AuthContext";
import {
  deleteSurveyAction,
  duplicateSurveyAction,
  exportSurveysAction,
  setSurveyStatusAction,
} from "@/services/survey.service";
import { SurveyListItem } from "@/types/survey";
import CreateSurveyDialog from "@/components/surveys/CreateSurveyDialog";
import ExportButton from "@/components/listings/ExportButton";
import ExportError from "@/components/listings/ExportError";
import { useCsvExport } from "@/hooks/useCsvExport";
import { EXPORT, EXPORT_FILENAMES } from "@/constants/exports";
import SurveyActionsMenu from "@/components/surveys/SurveyActionsMenu";
import { TONE_PILL_CLASS } from "@/constants/theme";

const PAGE_SIZE = 20;

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SurveysPage() {
  const {
    surveys,
    page,
    total,
    totalPages,
    search,
    setSearch,
    responseTarget,
    setResponseTarget,
    isLoading,
    error,
    setPage,
    refetch,
  } = useSurveys(PAGE_SIZE);

  const router = useRouter();
  const { makeAuthorizedRequest, makeAuthorizedDownload } = useAuth();
  const {
    isExporting,
    error: exportError,
    clearError: clearExportError,
    runExport,
  } = useCsvExport();
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDuplicate(surveyId: string) {
    setActionError(null);
    setDuplicatingId(surveyId);
    try {
      const copy = await duplicateSurveyAction(makeAuthorizedRequest, surveyId);
      router.push(`/dashboard/surveys/${copy.id}`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : SURVEYS_PAGE.duplicateError,
      );
      setDuplicatingId(null);
    }
  }

  async function handleToggleStatus(survey: SurveyListItem) {
    const confirmMessage = survey.is_active
      ? SURVEY_FORM.deactivateConfirm
      : SURVEY_FORM.activateConfirm;
    if (!window.confirm(confirmMessage)) return;
    setActionError(null);
    setTogglingId(survey.id);
    try {
      await setSurveyStatusAction(
        makeAuthorizedRequest,
        survey.id,
        !survey.is_active,
      );
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : SURVEYS_PAGE.statusError,
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(surveyId: string) {
    if (!window.confirm(SURVEY_FORM.deleteConfirm)) return;
    setActionError(null);
    setDeletingId(surveyId);
    try {
      await deleteSurveyAction(makeAuthorizedRequest, surveyId);
      // Deleting the last item on a page beyond the first would otherwise
      // refetch a now out-of-range page; step back instead.
      if (surveys.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await refetch();
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : SURVEYS_PAGE.deleteError,
      );
    } finally {
      setDeletingId(null);
    }
  }

  // The page offers no is_active/created_by/sort filters, so the export
  // mirrors the two the user can actually set.
  const handleExport = () =>
    runExport(
      () =>
        exportSurveysAction(makeAuthorizedDownload, {
          search: search || undefined,
          response_target: responseTarget || undefined,
        }),
      EXPORT_FILENAMES.surveys,
    );

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{SURVEYS_PAGE.title}</h1>
            <p className="text-muted-foreground text-sm">
              {SURVEYS_PAGE.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <ExportButton
              isExporting={isExporting}
              onClick={handleExport}
              disabled={isLoading || total === 0}
              emptyHint={total === 0 ? EXPORT.empty : undefined}
            />
            <CreateSurveyDialog />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {SURVEYS_PAGE.searchPlaceholder}
            </label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={SURVEYS_PAGE.searchPlaceholder}
              className="w-full sm:w-64"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {SURVEYS_PAGE.targetFilterLabel}
            </label>
            <select
              value={responseTarget}
              onChange={(e) =>
                setResponseTarget(e.target.value as ResponseTargetFilter)
              }
              className={`${SELECT_CLASS} w-full sm:w-48`}
            >
              <option value="">{SURVEYS_PAGE.allTargets}</option>
              {RESPONSE_TARGETS.map((target) => (
                <option key={target} value={target}>
                  {RESPONSE_TARGET_LABELS[target]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Separator />

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {exportError && (
          <ExportError message={exportError} onDismiss={clearExportError} />
        )}

        {actionError && (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : surveys.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {SURVEYS_PAGE.noSurveys}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {SURVEYS_PAGE.columns.name}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {SURVEYS_PAGE.columns.target}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {SURVEYS_PAGE.columns.status}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {SURVEYS_PAGE.columns.questions}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {SURVEYS_PAGE.columns.created}
                    </th>
                    <th className="px-4 py-3 font-medium sr-only">
                      {SURVEYS_PAGE.actions}
                    </th>
                    <ChevronHeaderCell />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {surveys.map((survey) => (
                    <tr
                      key={survey.id}
                      onClick={() =>
                        router.push(`/dashboard/surveys/${survey.id}/responses`)
                      }
                      className={`${ROW_HOVER_CLASS} bg-card`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <RowLink>{survey.name}</RowLink>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                          {RESPONSE_TARGET_LABELS[survey.response_target]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            TONE_PILL_CLASS[
                              SURVEY_STATUS_TONE[
                                survey.is_active ? "active" : "inactive"
                              ]
                            ]
                          }`}
                        >
                          {survey.is_active
                            ? SURVEYS_PAGE.statusActive
                            : SURVEYS_PAGE.statusInactive}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {survey.question_count}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(survey.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end">
                          <SurveyActionsMenu
                            survey={survey}
                            busy={
                              duplicatingId === survey.id ||
                              togglingId === survey.id ||
                              deletingId === survey.id
                            }
                            onDuplicate={() => handleDuplicate(survey.id)}
                            onToggleStatus={() => handleToggleStatus(survey)}
                            onDelete={() => handleDelete(survey.id)}
                          />
                        </div>
                      </td>
                      <ChevronCell />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  onClick={() =>
                    router.push(`/dashboard/surveys/${survey.id}/responses`)
                  }
                  className={`flex flex-col gap-2 rounded-lg border border-border p-3 ${CARD_HOVER_CLASS} bg-card`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{survey.name}</span>
                    <SurveyActionsMenu
                      survey={survey}
                      busy={
                        duplicatingId === survey.id ||
                        togglingId === survey.id ||
                        deletingId === survey.id
                      }
                      onDuplicate={() => handleDuplicate(survey.id)}
                      onToggleStatus={() => handleToggleStatus(survey)}
                      onDelete={() => handleDelete(survey.id)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {RESPONSE_TARGET_LABELS[survey.response_target]}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        TONE_PILL_CLASS[
                          SURVEY_STATUS_TONE[
                            survey.is_active ? "active" : "inactive"
                          ]
                        ]
                      }`}
                    >
                      {survey.is_active
                        ? SURVEYS_PAGE.statusActive
                        : SURVEYS_PAGE.statusInactive}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {SURVEYS_PAGE.columns.questions}: {survey.question_count}
                    </span>
                  </div>
                </div>
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
                <span>{SURVEYS_PAGE.pagination(page, totalPages)}</span>
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
    </div>
  );
}
