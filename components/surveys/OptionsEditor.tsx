"use client";

import {
  Control,
  FieldErrors,
  useFieldArray,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SURVEY_FORM } from "@/constants/surveys";
import { SurveyFormInput } from "@/schemas/survey.schema";

type OptionsEditorProps = {
  control: Control<SurveyFormInput>;
  register: UseFormRegister<SurveyFormInput>;
  watch: UseFormWatch<SurveyFormInput>;
  errors: FieldErrors<SurveyFormInput>;
  questionIndex: number;
  /** The question this option list belongs to is edit-locked: existing
   * options (ones with an id) can't be removed, but new ones can always be
   * added and every option's text stays editable. */
  locked?: boolean;
};

export default function OptionsEditor({
  control,
  register,
  watch,
  errors,
  questionIndex,
  locked,
}: OptionsEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  const optionsError = errors.questions?.[questionIndex]?.options;

  return (
    <div className="flex flex-col gap-2 pl-4 border-l-2 border-border">
      {fields.map((field, optionIndex) => {
        const optionError = optionsError?.[optionIndex]?.text?.message;
        const isExistingOption = Boolean(
          watch(`questions.${questionIndex}.options.${optionIndex}.id`),
        );
        const removeLocked = locked && isExistingOption;
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Input
                {...register(
                  `questions.${questionIndex}.options.${optionIndex}.text`,
                )}
                placeholder={SURVEY_FORM.optionPlaceholder}
                aria-invalid={!!optionError}
                className="max-w-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={removeLocked}
                title={
                  removeLocked
                    ? SURVEY_FORM.optionDeleteLockedReason
                    : undefined
                }
                onClick={() => remove(optionIndex)}
              >
                <X size={14} />
              </Button>
            </div>
            {optionError && (
              <p className="text-xs text-destructive">{optionError}</p>
            )}
          </div>
        );
      })}

      {typeof optionsError?.message === "string" && (
        <p className="text-xs text-destructive">{optionsError.message}</p>
      )}

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
    </div>
  );
}
