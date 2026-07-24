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
import { ENCUESTAS_FORM, RESPONSE_TYPE_LABELS } from "@/constants/surveys";
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
  readOnly?: boolean;
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
  readOnly,
}: QuestionEditorProps) {
  const responseType = watch(`questions.${index}.response_type`);
  const showOptions = CHOICE_TYPES.includes(responseType);
  const questionError = errors.questions?.[index];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-start gap-2">
        <span className="mt-2 text-sm font-medium text-muted-foreground w-6 shrink-0">
          {index + 1}.
        </span>
        <div className="flex-1 flex flex-col gap-1">
          <Input
            {...register(`questions.${index}.text`)}
            placeholder={ENCUESTAS_FORM.questionPlaceholder}
            disabled={readOnly}
          />
          {typeof questionError?.text?.message === "string" && (
            <p className="text-xs text-destructive">
              {questionError.text.message}
            </p>
          )}
        </div>
        {!readOnly && (
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
              disabled={!canRemove}
              onClick={onRemove}
              title="Eliminar"
              className="text-destructive"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 pl-0 sm:pl-8">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {ENCUESTAS_FORM.responseTypeLabel}
          </span>
          <select
            {...register(`questions.${index}.response_type`)}
            disabled={readOnly}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {RESPONSE_TYPES.map((type) => (
              <option key={type} value={type}>
                {RESPONSE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register(`questions.${index}.is_required`)}
            disabled={readOnly}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-muted-foreground">
            {ENCUESTAS_FORM.requiredLabel}
          </span>
        </label>
      </div>

      {showOptions && (
        <div className="pl-0 sm:pl-8">
          <OptionsEditor
            control={control}
            register={register}
            errors={errors}
            questionIndex={index}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
}
