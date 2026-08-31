"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SurveyForm from "@/components/surveys/SurveyForm";
import { useAuth } from "@/context/AuthContext";
import { getSurveyAction, updateSurveyAction } from "@/services/survey.service";
import { formToRequest, surveyToForm } from "@/lib/surveyForm";
import { SurveyFormInput } from "@/schemas/survey.schema";
import { SurveyResponse } from "@/types/survey";
import { SURVEY_FORM } from "@/constants/surveys";

export default function EditSurveyPage({
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
    router.push("/dashboard/surveys");
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <Link
          href="/dashboard/surveys"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft size={16} />
          {SURVEY_FORM.back}
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
            <h1 className="text-3xl font-semibold">{SURVEY_FORM.editTitle}</h1>

            <Separator />

            {locked && (
              <Alert>
                <AlertDescription>{SURVEY_FORM.lockedNotice}</AlertDescription>
              </Alert>
            )}

            <SurveyForm
              defaultValues={surveyToForm(survey)}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/dashboard/surveys")}
              readOnly={locked}
            />
          </>
        )}
      </Card>
    </div>
  );
}
