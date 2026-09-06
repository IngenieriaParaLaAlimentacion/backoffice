"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SurveyForm from "@/components/surveys/SurveyForm";
import { useAuth } from "@/context/AuthContext";
import {
  createSurveyAction,
  getFiesTemplateAction,
} from "@/services/survey.service";
import {
  emptySurveyForm,
  formToRequest,
  templateToForm,
} from "@/lib/surveyForm";
import { SurveyFormInput } from "@/schemas/survey.schema";
import { SURVEY_FORM } from "@/constants/surveys";
import { getErrorMessage } from "@/lib/errorMessages";

function NewSurveyContent() {
  const { makeAuthorizedRequest } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromFies = searchParams.get("from") === "fies";

  const [defaults, setDefaults] = useState<SurveyFormInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    setError(null);
    try {
      const template = await getFiesTemplateAction(makeAuthorizedRequest);
      setDefaults(templateToForm(template));
    } catch (err) {
      setError(
        getErrorMessage(err, { fallback: SURVEY_FORM.fiesTemplateError }),
      );
      setDefaults(emptySurveyForm());
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    if (fromFies) {
      loadTemplate();
    } else {
      setDefaults(emptySurveyForm());
    }
  }, [fromFies, loadTemplate]);

  const handleSubmit = async (values: SurveyFormInput) => {
    const created = await createSurveyAction(
      makeAuthorizedRequest,
      formToRequest(values),
    );
    router.push(`/dashboard/surveys/${created.id}`);
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

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">{SURVEY_FORM.createTitle}</h1>
        </div>

        <Separator />

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {defaults === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : (
          <SurveyForm
            defaultValues={defaults}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/dashboard/surveys")}
          />
        )}
      </Card>
    </div>
  );
}

export default function NewSurveyPage() {
  return (
    <Suspense fallback={null}>
      <NewSurveyContent />
    </Suspense>
  );
}
