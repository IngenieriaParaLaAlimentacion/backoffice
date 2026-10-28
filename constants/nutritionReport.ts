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

/** Rows of the saved-reports list per page. */
export const NUTRITION_REPORT_LIST_PAGE_SIZE = 12;

/** Used only when the response carries no `Content-Disposition`. */
export const NUTRITION_REPORT_PDF_FALLBACK_FILENAME = (month: string) =>
  `reporte-nutricional-${month}.pdf`;

export const NUTRITION_REPORT_TAB_PATH = "nutrition-report";

export const nutritionReportHref = (establishmentId: string, month: string) =>
  `/dashboard/establishments/${establishmentId}/${NUTRITION_REPORT_TAB_PATH}/${month}`;

export const NUTRITION_REPORT_PAGE = {
  subtitle: (total: number) =>
    total === 1 ? "1 reporte generado" : `${total} reportes generados`,
  newReport: "Generar nuevo reporte",
  empty:
    "Todavía no se generó ningún reporte para este comedor. Generá el primero con el botón de arriba.",
  columns: { month: "Mes", status: "Estado", createdAt: "Generado" },
  summaryStatus: {
    generated: "Completo",
    unavailable: "Sin texto",
    not_applicable: "Sin datos",
  },
  retry: "Reintentar",
} as const;

export const NUTRITION_REPORT_DIALOG = {
  title: "Generar nuevo reporte",
  description: "Elegí el mes del que querés el reporte.",
  monthLabel: "Mes del reporte",
  checking: "Buscando si ya existe un reporte de este mes…",
  alreadyExists:
    "Ya existe un reporte de este mes. Podés abrirlo sin volver a generarlo.",
  viewExisting: "Ver reporte",
  generate: "Generar reporte",
  generating: "Generando…",
  opening: "Abriendo reporte…",
  generatingHint:
    "Generar el reporte puede tardar un momento. No cierres esta pantalla.",
  cancel: "Cancelar",
  close: "Cerrar",
} as const;

export const NUTRITION_REPORT_DETAIL = {
  back: "Volver a reportes",
  title: (month: string) => `Reporte nutricional de ${month}`,
  notGenerated: "Todavía no se generó el reporte de este mes.",
  regenerateText: "Regenerar texto",
  generating: "Generando…",
  noData:
    "Sin datos: el comedor no tuvo ingresos de alimentos en este mes, por eso no hay déficits para mostrar.",
  summaryUnavailable:
    "El texto redactado por la IA no está disponible. Los datos calculados se muestran igual; podés volver a generar el texto.",
  downloadPdf: "Descargar PDF",
  downloading: "Descargando…",
  pdfBlockedHint:
    "Para descargar el PDF, primero regenerá el texto del reporte.",
  indicatorLabel: "Adecuación media del mes",
  overviewTitle: "Resumen",
  conclusionTitle: "Conclusión",
  retry: "Reintentar",
} as const;
