"use client";

import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SURVEY_FORM, RESPONSE_TYPE_LABELS } from "@/constants/surveys";
import { RESPONSE_TYPES, SurveyFormInput } from "@/schemas/survey.schema";
import OptionsEditor from "./OptionsEditor";

type QuestionEditorProps = {
  control: Control<SurveyFormInput>;
  register: UseFormRegister<SurveyFormInput>;
  watch: UseFormWatch<SurveyFormInput>;
  errors: FieldErrors<SurveyFormInput>;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  /** The survey already has recorded responses. */
  hasResponses?: boolean;
  /** This question's `is_required` when the form loaded (survey.py:
   * `_assert_editable` only forbids optional -> required, not the reverse). */
  originalIsRequired: boolean;
};

const CHOICE_TYPES = ["single_choice", "multiple_choice"];

export default function QuestionEditor({
  control,
  register,
  watch,
  errors,
  index,
  isFirst,
  isLast,
  canRemove,
  onMoveUp,
  onMoveDown,
  onRemove,
  hasResponses,
  originalIsRequired,
}: QuestionEditorProps) {
  const responseType = watch(`questions.${index}.response_type`);
  const showOptions = CHOICE_TYPES.includes(responseType);
  const questionError = errors.questions?.[index];

  // A question with an `id` already exists on the saved survey; one added via
  // "Agregar pregunta" in this session has none (see lib/surveyForm.ts).
  const isExistingQuestion = Boolean(watch(`questions.${index}.id`));
  const questionLocked = Boolean(hasResponses) && isExistingQuestion;
  // A new question can't be required at all; an existing one can only go
  // from required to optional, never the other way, once locked.
  const requiredLocked = isExistingQuestion
    ? questionLocked && !originalIsRequired
    : Boolean(hasResponses);
  const requiredLockedReason = isExistingQuestion
    ? SURVEY_FORM.questionRequiredLockedReason
    : SURVEY_FORM.newQuestionRequiredLockedReason;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-start gap-2">
        <span className="mt-2 text-sm font-medium text-muted-foreground w-6 shrink-0">
          {index + 1}.
        </span>
        <div className="flex-1 flex flex-col gap-1">
          <Input
            {...register(`questions.${index}.text`)}
            placeholder={SURVEY_FORM.questionPlaceholder}
          />
          {typeof questionError?.text?.message === "string" && (
            <p className="text-xs text-destructive">
              {questionError.text.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isFirst}
            onClick={onMoveUp}
            title="Subir"
          >
            <ArrowUp size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isLast}
            onClick={onMoveDown}
            title="Bajar"
          >
            <ArrowDown size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canRemove || questionLocked}
            onClick={onRemove}
            title={
              questionLocked
                ? SURVEY_FORM.questionDeleteLockedReason
                : "Eliminar"
            }
            className="text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pl-0 sm:pl-8">
        <label
          className="flex items-center gap-2 text-sm"
          title={
            questionLocked ? SURVEY_FORM.questionTypeLockedReason : undefined
          }
        >
          <span className="text-muted-foreground">
            {SURVEY_FORM.responseTypeLabel}
          </span>
          <select
            {...register(`questions.${index}.response_type`)}
            disabled={questionLocked}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {RESPONSE_TYPES.map((type) => (
              <option key={type} value={type}>
                {RESPONSE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label
          className="flex items-center gap-2 text-sm"
          title={requiredLocked ? requiredLockedReason : undefined}
        >
          <input
            type="checkbox"
            {...register(`questions.${index}.is_required`)}
            disabled={requiredLocked}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-muted-foreground">
            {SURVEY_FORM.requiredLabel}
          </span>
        </label>
      </div>

      {showOptions && (
        <div className="pl-0 sm:pl-8">
          <OptionsEditor
            control={control}
            register={register}
            watch={watch}
            errors={errors}
            questionIndex={index}
            locked={questionLocked}
          />
        </div>
      )}
    </div>
  );
}
