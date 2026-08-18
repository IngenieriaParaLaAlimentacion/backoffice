import { z } from "zod";

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
    // Choice questions must define at least one option (CA5/CA9).
    if (
      CHOICE_TYPES.includes(
        question.response_type as (typeof CHOICE_TYPES)[number],
      ) &&
      question.options.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Agregá al menos una opción",
      });
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
