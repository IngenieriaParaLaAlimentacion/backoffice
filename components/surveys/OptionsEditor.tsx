"use client";

import {
  Control,
  FieldErrors,
  useFieldArray,
  UseFormRegister,
} from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SURVEY_FORM } from "@/constants/surveys";
import { SurveyFormInput } from "@/schemas/survey.schema";

type OptionsEditorProps = {
  control: Control<SurveyFormInput>;
  register: UseFormRegister<SurveyFormInput>;
  errors: FieldErrors<SurveyFormInput>;
  questionIndex: number;
  readOnly?: boolean;
};

export default function OptionsEditor({
  control,
  register,
  errors,
  questionIndex,
  readOnly,
}: OptionsEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  const optionsError = errors.questions?.[questionIndex]?.options;

  return (
    <div className="flex flex-col gap-2 pl-4 border-l-2 border-border">
      {fields.map((field, optionIndex) => (
        <div key={field.id} className="flex items-center gap-2">
          <Input
            {...register(
              `questions.${questionIndex}.options.${optionIndex}.text`,
            )}
            placeholder={SURVEY_FORM.optionPlaceholder}
            disabled={readOnly}
            className="max-w-sm"
          />
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(optionIndex)}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      ))}

      {typeof optionsError?.message === "string" && (
        <p className="text-xs text-destructive">{optionsError.message}</p>
      )}

      {!readOnly && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit text-muted-foreground"
          onClick={() => append({ text: "" })}
        >
          <Plus size={14} />
          {SURVEY_FORM.addOption}
        </Button>
      )}
    </div>
  );
}
