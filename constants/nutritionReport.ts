import { ERROR_TYPES } from "@/lib/apiError";
import {
  GapaGroup,
  Macronutrient,
  NutritionReportSortOrder,
  PrioritizedNutrient,
} from "@/types/nutritionReport";

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
  columns: { month: "Mes", status: "Estado", createdAt: "Generado el" },
  summaryStatus: {
    generated: "Completo",
    unavailable: "Sin texto",
    not_applicable: "Sin datos",
  },
  retry: "Reintentar",
  sortLabel: "Ordenar reportes",
  sortOptions: [
    { value: "month_desc", label: "Más recientes primero" },
    { value: "month_asc", label: "Más antiguos primero" },
  ] as { value: NutritionReportSortOrder; label: string }[],
  actionsMenuLabel: "Más acciones",
  viewReport: "Ver reporte",
  downloadPdf: "Descargar PDF",
  recalculate: "Volver a calcular",
  recalculated: (month: string) => `Se completó el reporte de ${month}.`,
  pdfBlockedHint:
    "El texto del reporte no está disponible: volvé a generarlo para poder descargar el PDF.",
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
  generated: "Reporte generado.",
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
  recalculate: "Volver a calcular",
  recalculating: "Calculando…",
  noDataHint:
    "Si se cargaron ingresos de alimentos después de generar este reporte, podés volver a calcularlo.",
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

/** Spanish names and units of the nutrients a report evaluates, as the backend prints them. */
export const NUTRIENT_LABELS: Record<
  PrioritizedNutrient,
  { name: string; unit: string }
> = {
  calcio: { name: "Calcio", unit: "mg" },
  vitamina_a: { name: "Vitamina A (RAE)", unit: "µg" },
  folato: { name: "Folato (EFD)", unit: "µg" },
  vitamina_b12: { name: "Vitamina B12", unit: "µg" },
  vitamina_c: { name: "Vitamina C", unit: "mg" },
  hierro: { name: "Hierro", unit: "mg" },
  zinc: { name: "Zinc", unit: "mg" },
};

export const MACRO_LABELS: Record<Macronutrient, string> = {
  proteinas: "Proteínas",
  lipidos: "Lípidos",
  carbohidratos: "Carbohidratos",
};

export const GAPA_GROUP_LABELS: Record<GapaGroup, string> = {
  verduras_y_frutas: "Verduras y frutas",
  legumbres_cereales_papa_pan_y_pastas:
    "Legumbres, cereales, papa, pan y pastas",
  leche_yogur_y_quesos: "Leche, yogur y quesos",
  carnes_y_huevos: "Carnes y huevos",
  aceites_frutas_secas_y_semillas: "Aceites, frutas secas y semillas",
  consumo_opcional: "Consumo opcional",
};

export const NUTRITION_REPORT_SECTIONS = {
  nutrients: {
    title: "Nutrientes",
    subtitle:
      "Aporte por cada 1.000 kcal de lo que llegó al comedor, frente a la referencia. Por debajo de 2/3 de la referencia, el nutriente está en riesgo.",
    columns: {
      nutrient: "Nutriente",
      reference: "Referencia",
      minimum: "Mínimo (2/3)",
      amount: "Aporte",
      adequacy: "Adecuación",
      status: "Estado",
    },
    atRisk: "En riesgo",
    adequate: "Adecuado",
  },
  macros: {
    title: "Macronutrientes",
    subtitle: "Porcentaje de la energía que aporta cada uno.",
    columns: {
      macro: "Macronutriente",
      share: "% de la energía",
      range: "Rango recomendado",
      status: "Estado",
    },
    inRange: "Dentro del rango",
    outOfRange: "Fuera del rango",
    range: (min: string, max: string) => `${min} a ${max}`,
  },
  gapa: {
    title: "Grupos de alimentos (GAPA)",
    subtitle: "Porcentaje de la energía que aporta cada grupo.",
    columns: { group: "Grupo", share: "% de la energía", status: "Estado" },
    present: "Presente",
    missing: "Ausente",
    missingSummary: (groups: string[]) =>
      groups.length === 1
        ? `Grupo ausente: ${groups[0]}.`
        : `Grupos ausentes: ${groups.join(", ")}.`,
  },
} as const;

export const NUTRITION_REPORT_EXTRAS = {
  suggested: {
    title: "Alimentos sugeridos",
    subtitle:
      "Los alimentos que mejor cubren cada nutriente en riesgo, por cada 100 kcal.",
    per100kcal: (amount: string) => `${amount} cada 100 kcal`,
  },
  excluded: {
    one: (name: string) =>
      `Un alimento quedó afuera del cálculo porque no se puede convertir a gramos: ${name}.`,
    many: (names: string[]) =>
      `Estos alimentos quedaron afuera del cálculo porque no se pueden convertir a gramos: ${names.join(", ")}.`,
  },
} as const;

/** Outcomes of calculating a month again, told in a dialog the user closes. */
export const NUTRITION_REPORT_NOTICE = {
  completedTitle: "Reporte completado",
  unchangedTitle: "Sin cambios",
  unchanged: (month: string) =>
    `${month} sigue sin ingresos de alimentos, así que el reporte no cambió.`,
  close: "Entendido",
} as const;
