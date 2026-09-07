"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  surveySchema,
  SurveyFormInput,
  RESPONSE_TARGETS,
} from "@/schemas/survey.schema";
import {
  RESPONSE_TARGET_DESCRIPTIONS,
  RESPONSE_TARGET_LABELS,
  SURVEY_FORM,
  MAX_QUESTIONS,
} from "@/constants/surveys";
import { ApiError, ERROR_TYPES } from "@/lib/apiError";
import QuestionEditor from "./QuestionEditor";
import { getErrorMessage } from "@/lib/errorMessages";

type SurveyFormProps = {
  defaultValues: SurveyFormInput;
  onSubmit: (values: SurveyFormInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  /** The survey already has recorded responses: target and response-number
   * requiredness are locked, and questions keep their narrower edit rules. */
  hasResponses?: boolean;
};

export default function SurveyForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = SURVEY_FORM.save,
  hasResponses,
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
      if (err instanceof ApiError && err.status === 409) {
        // Two different 409s share the status: the survey got locked while the
        // form was open, or the name is taken. Only `type` tells them apart.
        if (err.type === ERROR_TYPES.SURVEY_LOCKED) {
          setFormError(SURVEY_FORM.lockedConflict);
          return;
        }
        setError("name", { message: SURVEY_FORM.nameConflict });
        return;
      }
      setFormError(
        getErrorMessage(err, {
          overrides: {
            [ERROR_TYPES.INVALID_SURVEY_STRUCTURE]:
              SURVEY_FORM.invalidStructure,
          },
          fallback: SURVEY_FORM.saveError,
        }),
      );
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
          {SURVEY_FORM.nameLabel}
          <span className="text-destructive ml-0.5">*</span>
        </label>
        <Input
          {...register("name")}
          placeholder={SURVEY_FORM.namePlaceholder}
        />
        {errors.name?.message && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* --- Description --- */}
      <div className="flex flex-col gap-1 max-w-md">
        <label className="text-sm font-medium">
          {SURVEY_FORM.descriptionLabel}
        </label>
        <textarea
          {...register("description")}
          placeholder={SURVEY_FORM.descriptionPlaceholder}
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        />
        {errors.description?.message && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* --- Response target (CA1) --- */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          {SURVEY_FORM.targetLabel}
          <span className="text-destructive ml-0.5">*</span>
        </span>
        {/* Vertical so every option's explanation is readable at once: the
            choice locks on the first response, so it is made once and for all. */}
        <div className="flex flex-col gap-2">
          {RESPONSE_TARGETS.map((target) => (
            <label
              key={target}
              className="flex items-start gap-2 text-sm has-disabled:opacity-50"
              title={hasResponses ? SURVEY_FORM.targetLockedReason : undefined}
            >
              <input
                type="radio"
                value={target}
                {...register("response_target")}
                disabled={hasResponses}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="flex flex-col">
                <span>{RESPONSE_TARGET_LABELS[target]}</span>
                <span className="text-xs text-muted-foreground">
                  {RESPONSE_TARGET_DESCRIPTIONS[target]}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.response_target?.message && (
          <p className="text-xs text-destructive">
            {errors.response_target.message}
          </p>
        )}
      </div>

      <label
        className="flex items-start gap-2 text-sm has-disabled:opacity-50"
        title={
          hasResponses
            ? SURVEY_FORM.responseNumberRequiredLockedReason
            : undefined
        }
      >
        <input
          type="checkbox"
          {...register("requires_response_number")}
          disabled={hasResponses}
          className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
        />
        <span className="flex flex-col">
          <span>{SURVEY_FORM.responseNumberRequiredLabel}</span>
          <span className="text-xs text-muted-foreground">
            {SURVEY_FORM.responseNumberRequiredDescription}
          </span>
        </span>
      </label>

      <Separator />

      {/* --- Questions --- */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {SURVEY_FORM.questionsLabel}
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
            hasResponses={hasResponses}
            originalIsRequired={field.is_required}
          />
        ))}
      </div>

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
        {SURVEY_FORM.addQuestion}
      </Button>

      <Separator />

      {/* --- Submit / Cancel --- */}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? SURVEY_FORM.saving : submitLabel}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {SURVEY_FORM.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}
