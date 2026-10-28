import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import {
  NutritionReportAnalysis,
  NutritionReportResponse,
  NutritionReportSummary,
  ReportMonth,
} from "@/types/nutritionReport";

export const REPORT_SCOPE_NOTE =
  "Este reporte evalúa lo que llega al comedor, no la dieta completa de quienes comen allí.";

export const REPORT_PDF_FILENAME = (month: ReportMonth) =>
  `reporte-nutricional-${month}.pdf`;

const EMPTY_ANALYSIS: NutritionReportAnalysis = {
  energy_kcal: null,
  mean_adequacy_percent: null,
  nutrients: [],
  macros: [],
  gapa_groups: [],
  limits: [],
  top_sources: [],
  foods_without_conversion: [],
  warnings: [],
};

const FULL_ANALYSIS: NutritionReportAnalysis = {
  energy_kcal: 182000,
  mean_adequacy_percent: 78.4,
  nutrients: [
    {
      nutrient: "calcio",
      amount_per_1000_kcal: 310,
      reference_per_1000_kcal: 500,
      minimum_per_1000_kcal: 333.33,
      adequacy_percent: 62,
      adequacy_capped_percent: 62,
      at_risk: true,
    },
    {
      nutrient: "hierro",
      amount_per_1000_kcal: 8.4,
      reference_per_1000_kcal: 7,
      minimum_per_1000_kcal: 4.67,
      adequacy_percent: 120,
      adequacy_capped_percent: 100,
      at_risk: false,
    },
  ],
  macros: [
    {
      macro: "proteinas",
      energy_share_percent: 14,
      min_percent: 10,
      max_percent: 15,
      in_range: true,
    },
    {
      macro: "lipidos",
      energy_share_percent: 38,
      min_percent: 25,
      max_percent: 35,
      in_range: false,
    },
    {
      macro: "carbohidratos",
      energy_share_percent: 48,
      min_percent: 50,
      max_percent: 65,
      in_range: false,
    },
  ],
  gapa_groups: [
    {
      group: "verduras_y_frutas",
      energy_share_percent: 6,
      missing: false,
    },
    {
      group: "leche_yogur_y_quesos",
      energy_share_percent: 0,
      missing: true,
    },
  ],
  limits: [{ code: "sodio", amount_per_1000_kcal: 1200 }],
  top_sources: [
    {
      nutrient: "calcio",
      foods: [
        {
          food_id: "food-leche",
          name: "Leche entera",
          amount_per_100_kcal: 190,
        },
      ],
    },
  ],
  foods_without_conversion: [{ food_id: "food-varios", name: "Varios" }],
  warnings: [
    "Un alimento quedó afuera del cálculo por no tener conversión a gramos.",
  ],
};

const SUMMARY: NutritionReportSummary = {
  overview: "El mes dejó el calcio por debajo del mínimo recomendado.",
  at_risk_nutrients: ["calcio"],
  macros: "Los lípidos superan el rango y los carbohidratos quedan cortos.",
  gapa_groups: "No ingresaron lácteos durante el mes.",
  incorporate: "Conviene incorporar leche, yogur o quesos.",
  conclusion: "El aporte de calcio es el principal punto a mejorar.",
  limitations: [REPORT_SCOPE_NOTE],
};

type ReportOptions = {
  establishmentId?: string;
  month: ReportMonth;
  /** A month without intakes: no deficits, no AI text. */
  noData?: boolean;
  /** The AI failed: the figures are saved, the text isn't. */
  summaryUnavailable?: boolean;
};

export function buildNutritionReport({
  establishmentId = MOCK_ESTABLISHMENTS[0].id,
  month,
  noData = false,
  summaryUnavailable = false,
}: ReportOptions): NutritionReportResponse {
  const status = noData
    ? "not_applicable"
    : summaryUnavailable
      ? "unavailable"
      : "generated";
  return {
    id: `report-${establishmentId}-${month}`,
    establishment_id: establishmentId,
    month,
    has_data: !noData,
    reference_profile: "Niños y niñas de 6 a 12 años",
    analysis: structuredClone(noData ? EMPTY_ANALYSIS : FULL_ANALYSIS),
    summary_status: status,
    summary: status === "generated" ? structuredClone(SUMMARY) : null,
    scope_note: noData ? null : REPORT_SCOPE_NOTE,
    created_at: `${month}-28T12:00:00Z`,
    updated_at: `${month}-28T12:00:00Z`,
  };
}

const DEFAULT_REPORTS = (): NutritionReportResponse[] => [
  buildNutritionReport({ month: "2026-09" }),
  buildNutritionReport({ month: "2026-08", summaryUnavailable: true }),
  buildNutritionReport({ month: "2026-07", noData: true }),
];

const reportsByEstablishment = new Map<string, NutritionReportResponse[]>();

/** The reports saved for a comedor; the first one is seeded, the rest start empty. */
export function savedNutritionReports(establishmentId: string) {
  if (!reportsByEstablishment.has(establishmentId)) {
    reportsByEstablishment.set(
      establishmentId,
      establishmentId === MOCK_ESTABLISHMENTS[0].id ? DEFAULT_REPORTS() : [],
    );
  }
  return reportsByEstablishment.get(establishmentId)!;
}

export function saveNutritionReport(report: NutritionReportResponse) {
  const saved = savedNutritionReports(report.establishment_id);
  const index = saved.findIndex((item) => item.month === report.month);
  if (index === -1) saved.push(report);
  else saved[index] = report;
}

export function resetNutritionReportFixture() {
  reportsByEstablishment.clear();
}
