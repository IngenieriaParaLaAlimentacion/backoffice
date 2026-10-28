import { ERROR_TYPES } from "@/lib/apiError";

/** Backend errors of the nutrition report screen, keyed by `type`. */
export const NUTRITION_REPORT_ERROR_MESSAGES: Record<string, string> = {
  [ERROR_TYPES.NUTRITION_REPORT_MONTH_NOT_OVER]:
    "Ese mes todavía no terminó. Elegí un mes ya cerrado para generar el reporte.",
  [ERROR_TYPES.NUTRITION_REPORT_NOT_FOUND]:
    "Todavía no se generó el reporte de ese mes.",
  [ERROR_TYPES.NUTRITION_REPORT_SUMMARY_UNAVAILABLE]:
    "El texto del reporte no está disponible, por eso no se puede descargar. Volvé a generar el reporte para que se redacte el texto.",
  [ERROR_TYPES.NUTRITION_REPORT_CONVERSION_UNAVAILABLE]:
    "No hay datos suficientes para calcular el reporte: ninguno de los alimentos recibidos en el mes se puede convertir a gramos.",
  [ERROR_TYPES.NUTRITION_REPORT_GENERATION_TIMEOUT]:
    "Generar el reporte tardó más de lo permitido y no se guardó nada. Podés volver a intentarlo.",
};

/** The AI quota and the attempts limit read the same to the user. */
export const NUTRITION_REPORT_LIMIT_ERROR_TYPES: string[] = [
  ERROR_TYPES.AI_QUOTA_EXHAUSTED,
  ERROR_TYPES.RATE_LIMITED,
];

export const NUTRITION_REPORT_LIMIT_MESSAGE = (wait?: string) =>
  wait
    ? `Se alcanzó el límite de uso para generar reportes. Podés volver a intentarlo en ${wait}.`
    : "Se alcanzó el límite de uso para generar reportes. Volvé a intentar más tarde.";

export const NUTRITION_REPORT_FALLBACK_ERROR =
  "No se pudo completar la operación con el reporte nutricional. Volvé a intentar en unos minutos.";
