"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SurveyForm from "@/components/encuestas/SurveyForm";
import { useAuth } from "@/context/AuthContext";
import {
  deleteSurveyAction,
  getSurveyAction,
  setSurveyStatusAction,
  updateSurveyAction,
} from "@/services/survey.service";
import { formToRequest, surveyToForm } from "@/lib/surveyForm";
import { SurveyFormInput } from "@/schemas/survey.schema";
import { SurveyResponse } from "@/types/survey";
import { ENCUESTAS_FORM } from "@/constants/surveys";

export default function EditarEncuestaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { makeAuthorizedRequest } = useAuth();
  const router = useRouter();

  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const fetchSurvey = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSurveyAction(makeAuthorizedRequest, id);
      setSurvey(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar la encuesta",
      );
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthorizedRequest, id]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  const locked = (survey?.response_count ?? 0) > 0;

  const handleSubmit = async (values: SurveyFormInput) => {
    const updated = await updateSurveyAction(
      makeAuthorizedRequest,
      id,
      formToRequest(values),
    );
    setSurvey(updated);
    router.push("/dashboard/encuestas");
  };

  const handleToggleStatus = async () => {
    if (!survey) return;
    setActionError(null);
    setIsBusy(true);
    try {
      const updated = await setSurveyStatusAction(
        makeAuthorizedRequest,
        id,
        !survey.is_active,
      );
      setSurvey(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(ENCUESTAS_FORM.deleteConfirm)) return;
    setActionError(null);
    setIsBusy(true);
    try {
      await deleteSurveyAction(makeAuthorizedRequest, id);
      router.push("/dashboard/encuestas");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al eliminar");
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-8 flex flex-col gap-6">
        <Link
          href="/dashboard/encuestas"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft size={16} />
          {ENCUESTAS_FORM.back}
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : error || !survey ? (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error ?? "Encuesta no encontrada"}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">
                {ENCUESTAS_FORM.editTitle}
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={handleToggleStatus}
                >
                  {survey.is_active
                    ? ENCUESTAS_FORM.deactivate
                    : ENCUESTAS_FORM.activate}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isBusy}
                  onClick={handleDelete}
                >
                  {ENCUESTAS_FORM.delete}
                </Button>
              </div>
            </div>

            <Separator />

            {locked && (
              <Alert>
                <AlertDescription>
                  {ENCUESTAS_FORM.lockedNotice}
                </AlertDescription>
              </Alert>
            )}

            {actionError && (
              <Alert variant="destructive">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <SurveyForm
              defaultValues={surveyToForm(survey)}
              onSubmit={handleSubmit}
              readOnly={locked}
            />
          </>
        )}
      </Card>
    </div>
  );
}
