import { z } from "zod";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  SURVEY_OPTION_COUNT_MESSAGE,
} from "@/constants/surveys";

export const RESPONSE_TYPES = [
  "text",
  "single_choice",
  "multiple_choice",
  "numeric",
  "date",
] as const;

export const RESPONSE_TARGETS = [
  "subject",
  "establishment",
  "anonymous",
] as const;

const CHOICE_TYPES = ["single_choice", "multiple_choice"] as const;

const optionSchema = z.object({
  id: z.string().nullish(),
  text: z
    .string()
    .min(1, "La opción no puede estar vacía")
    .max(200, "Máximo 200 caracteres")
    .trim(),
});

const questionSchema = z
  .object({
    id: z.string().nullish(),
    text: z
      .string()
      .min(1, "La pregunta es requerida")
      .max(500, "Máximo 500 caracteres")
      .trim(),
    response_type: z.enum(RESPONSE_TYPES),
    is_required: z.boolean(),
    options: z.array(optionSchema),
  })
  .superRefine((question, ctx) => {
    const isChoice = CHOICE_TYPES.includes(
      question.response_type as (typeof CHOICE_TYPES)[number],
    );
    if (!isChoice) return;

    // CA5/CA9.
    if (
      question.options.length < MIN_OPTIONS ||
      question.options.length > MAX_OPTIONS
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: SURVEY_OPTION_COUNT_MESSAGE,
      });
      return;
    }

    // The backend rejects duplicates case-insensitively; match that rule so
    // the author isn't told about it only after pressing Guardar.
    const seen = new Set<string>();
    for (const [index, option] of question.options.entries()) {
      const key = option.text.trim().toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["options", index, "text"],
          message: "Esta opción está repetida",
        });
      }
      seen.add(key);
    }
  });

export const surveySchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre es requerido")
      .max(120, "Máximo 120 caracteres")
      .trim(),
    description: z
      .string()
      .max(1000, "Máximo 1000 caracteres")
      .trim()
      .nullish(),
    // "" is the unselected state. The API has no default for response_target and
    // the choice is effectively irreversible (it locks on the first response), so
    // a create-from-scratch draft starts blank rather than guessing (CA1).
    response_target: z.enum(["", ...RESPONSE_TARGETS]),
    // Between 1 and 30 questions (CA9).
    questions: z
      .array(questionSchema)
      .min(1, "La encuesta debe tener al menos una pregunta")
      .max(30, "La encuesta no puede superar las 30 preguntas"),
  })
  .superRefine((survey, ctx) => {
    if (survey.response_target === "") {
      ctx.addIssue({
        code: "custom",
        path: ["response_target"],
        message: "Elegí un destino para la encuesta",
      });
    }
  });

export type SurveyFormInput = z.infer<typeof surveySchema>;
