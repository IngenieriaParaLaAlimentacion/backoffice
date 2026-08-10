"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ENCUESTAS_PAGE,
  RESPUESTAS_PAGE,
  SCOPE_LABELS,
} from "@/constants/surveys";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowLink,
  ROW_HOVER_CLASS,
} from "@/components/listings/RowAffordance";
import { useSurveys } from "@/hooks/useSurveys";
import { useAuth } from "@/context/AuthContext";
import { duplicateSurveyAction } from "@/services/survey.service";
import CreateSurveyDialog from "@/components/encuestas/CreateSurveyDialog";

const PAGE_SIZE = 20;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function EncuestasPage() {
  const {
    surveys,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    setPage,
  } = useSurveys(PAGE_SIZE);

  const router = useRouter();
  const { makeAuthorizedRequest } = useAuth();
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  async function handleDuplicate(surveyId: string) {
    setDuplicatingId(surveyId);
    try {
      const copy = await duplicateSurveyAction(makeAuthorizedRequest, surveyId);
      router.push(`/dashboard/encuestas/${copy.id}`);
    } catch {
      setDuplicatingId(null);
    }
  }

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {ENCUESTAS_PAGE.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {ENCUESTAS_PAGE.subtitle}
            </p>
          </div>
          <div className="self-start">
            <CreateSurveyDialog />
          </div>
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={ENCUESTAS_PAGE.searchPlaceholder}
          className="max-w-xs"
        />

        <Separator />

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : surveys.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {ENCUESTAS_PAGE.noSurveys}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {ENCUESTAS_PAGE.columns.name}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ENCUESTAS_PAGE.columns.scope}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ENCUESTAS_PAGE.columns.status}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ENCUESTAS_PAGE.columns.questions}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ENCUESTAS_PAGE.columns.created}
                    </th>
                    <th className="px-4 py-3 font-medium sr-only">Acciones</th>
                    <ChevronHeaderCell />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {surveys.map((survey) => (
                    <tr
                      key={survey.id}
                      onClick={() =>
                        router.push(`/dashboard/encuestas/${survey.id}`)
                      }
                      className={`${ROW_HOVER_CLASS} bg-card`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <RowLink>{survey.name}</RowLink>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                          {SCOPE_LABELS[survey.scope]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            survey.is_active
                              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-transparent"
                          }`}
                        >
                          {survey.is_active
                            ? ENCUESTAS_PAGE.statusActive
                            : ENCUESTAS_PAGE.statusInactive}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {survey.question_count}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(survey.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={RESPUESTAS_PAGE.viewResponses}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/encuestas/${survey.id}/respuestas`,
                              );
                            }}
                          >
                            <BarChart3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Duplicar"
                            disabled={duplicatingId === survey.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(survey.id);
                            }}
                          >
                            {duplicatingId === survey.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </Button>
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
                    router.push(`/dashboard/encuestas/${survey.id}`)
                  }
                  className={`flex flex-col gap-2 rounded-lg border border-border p-3 ${CARD_HOVER_CLASS} bg-card`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{survey.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={RESPUESTAS_PAGE.viewResponses}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/dashboard/encuestas/${survey.id}/respuestas`,
                          );
                        }}
                      >
                        <BarChart3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Duplicar"
                        disabled={duplicatingId === survey.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(survey.id);
                        }}
                      >
                        {duplicatingId === survey.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {SCOPE_LABELS[survey.scope]}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        survey.is_active
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-transparent"
                      }`}
                    >
                      {survey.is_active
                        ? ENCUESTAS_PAGE.statusActive
                        : ENCUESTAS_PAGE.statusInactive}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {ENCUESTAS_PAGE.columns.questions}:{" "}
                      {survey.question_count}
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
                <span>{ENCUESTAS_PAGE.pagination(page, totalPages)}</span>
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
