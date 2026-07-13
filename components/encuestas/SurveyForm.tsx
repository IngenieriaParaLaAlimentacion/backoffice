"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { surveySchema, SurveyFormInput } from "@/schemas/survey.schema";
import { SCOPE_LABELS, ENCUESTAS_FORM, MAX_QUESTIONS } from "@/constants/surveys";
import { SurveyScope } from "@/types/survey";
import { ApiError } from "@/services/survey.service";
import QuestionEditor from "./QuestionEditor";
import EstablishmentPicker from "./EstablishmentPicker";

type SurveyFormProps = {
  defaultValues: SurveyFormInput;
  onSubmit: (values: SurveyFormInput) => Promise<void>;
  submitLabel?: string;
  readOnly?: boolean;
};

const SCOPES: SurveyScope[] = ["generic", "targeted"];

export default function SurveyForm({
  defaultValues,
  onSubmit,
  submitLabel = ENCUESTAS_FORM.save,
  readOnly,
}: SurveyFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    watch,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SurveyFormInput>({
    resolver: zodResolver(surveySchema),
    mode: "onChange",
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "questions",
  });

  const scope = watch("scope");
  const questionsError =
    errors.questions?.root?.message ??
    (typeof errors.questions?.message === "string"
      ? errors.questions.message
      : undefined);

  async function submit(values: SurveyFormInput) {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      // Surface a duplicate-name 409 on the name field (CA2).
      if (err instanceof ApiError && err.status === 409) {
        setError("name", { message: ENCUESTAS_FORM.nameConflict });
        return;
      }
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* --- Name --- */}
      <div className="flex flex-col gap-1 max-w-md">
        <label className="text-sm font-medium">
          {ENCUESTAS_FORM.nameLabel}
          <span className="text-destructive ml-0.5">*</span>
        </label>
        <Input
          {...register("name")}
          placeholder={ENCUESTAS_FORM.namePlaceholder}
          disabled={readOnly}
        />
        {errors.name?.message && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* --- Description --- */}
      <div className="flex flex-col gap-1 max-w-md">
        <label className="text-sm font-medium">
          {ENCUESTAS_FORM.descriptionLabel}
        </label>
        <textarea
          {...register("description")}
          placeholder={ENCUESTAS_FORM.descriptionPlaceholder}
          disabled={readOnly}
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        />
        {errors.description?.message && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* --- Scope --- */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{ENCUESTAS_FORM.scopeLabel}</span>
        <div className="flex gap-4">
          {SCOPES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                value={s}
                {...register("scope")}
                disabled={readOnly}
                className="h-4 w-4 accent-primary"
              />
              {SCOPE_LABELS[s]}
            </label>
          ))}
        </div>
      </div>

      {scope === "targeted" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            {ENCUESTAS_FORM.establishmentsLabel}
          </span>
          <Controller
            control={control}
            name="establishment_ids"
            render={({ field }) => (
              <EstablishmentPicker
                value={field.value}
                onChange={field.onChange}
                error={errors.establishment_ids?.message}
                readOnly={readOnly}
              />
            )}
          />
        </div>
      )}

      <Separator />

      {/* --- Questions --- */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {ENCUESTAS_FORM.questionsLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          {fields.length}/{MAX_QUESTIONS}
        </span>
      </div>

      {questionsError && (
        <p className="text-xs text-destructive">{questionsError}</p>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <QuestionEditor
            key={field.id}
            control={control}
            register={register}
            watch={watch}
            errors={errors}
            index={index}
            isFirst={index === 0}
            isLast={index === fields.length - 1}
            canRemove={fields.length > 1}
            onMoveUp={() => move(index, index - 1)}
            onMoveDown={() => move(index, index + 1)}
            onRemove={() => remove(index)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={fields.length >= MAX_QUESTIONS}
          onClick={() =>
            append({
              text: "",
              response_type: "text",
              is_required: false,
              options: [],
            })
          }
        >
          <Plus size={16} />
          {ENCUESTAS_FORM.addQuestion}
        </Button>
      )}

      {!readOnly && (
        <>
          <Separator />
          <Button
            type="submit"
            size="lg"
            className="w-fit"
            disabled={isSubmitting}
          >
            {isSubmitting ? ENCUESTAS_FORM.saving : submitLabel}
          </Button>
        </>
      )}
    </form>
  );
}
