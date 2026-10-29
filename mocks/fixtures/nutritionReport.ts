import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import {
  NutritionReportAnalysis,
  NutritionReportResponse,
  NutritionReportSummary,
  ReportMonth,
} from "@/types/nutritionReport";

export const REPORT_SCOPE_NOTE =
  "Este informe evalúa el equilibrio nutricional de los alimentos que llegaron al comedor durante el mes. No conoce la dieta completa de los chicos, no indica si la cantidad alcanza y no reemplaza la evaluación de un nutricionista.";

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
      name: "Calcio",
      unit: "mg",
      amount_per_1000_kcal: 310,
      reference_per_1000_kcal: 500,
      minimum_per_1000_kcal: 333.33,
      adequacy_percent: 62.0,
      adequacy_capped_percent: 62.0,
      at_risk: true,
    },
    {
      nutrient: "vitamina_a",
      name: "Vitamina A (RAE)",
      unit: "µg",
      amount_per_1000_kcal: 260,
      reference_per_1000_kcal: 300,
      minimum_per_1000_kcal: 200.0,
      adequacy_percent: 86.67,
      adequacy_capped_percent: 86.67,
      at_risk: false,
    },
    {
      nutrient: "folato",
      name: "Folato (EFD)",
      unit: "µg",
      amount_per_1000_kcal: 150,
      reference_per_1000_kcal: 200,
      minimum_per_1000_kcal: 133.33,
      adequacy_percent: 75.0,
      adequacy_capped_percent: 75.0,
      at_risk: false,
    },
    {
      nutrient: "vitamina_b12",
      name: "Vitamina B12",
      unit: "µg",
      amount_per_1000_kcal: 0.5,
      reference_per_1000_kcal: 1.2,
      minimum_per_1000_kcal: 0.8,
      adequacy_percent: 41.67,
      adequacy_capped_percent: 41.67,
      at_risk: true,
    },
    {
      nutrient: "vitamina_c",
      name: "Vitamina C",
      unit: "mg",
      amount_per_1000_kcal: 35,
      reference_per_1000_kcal: 30,
      minimum_per_1000_kcal: 20.0,
      adequacy_percent: 116.67,
      adequacy_capped_percent: 100,
      at_risk: false,
    },
    {
      nutrient: "hierro",
      name: "Hierro",
      unit: "mg",
      amount_per_1000_kcal: 8.4,
      reference_per_1000_kcal: 7,
      minimum_per_1000_kcal: 4.67,
      adequacy_percent: 120.0,
      adequacy_capped_percent: 100,
      at_risk: false,
    },
    {
      nutrient: "zinc",
      name: "Zinc",
      unit: "mg",
      amount_per_1000_kcal: 4.2,
      reference_per_1000_kcal: 6,
      minimum_per_1000_kcal: 4.0,
      adequacy_percent: 70.0,
      adequacy_capped_percent: 70.0,
      at_risk: false,
    },
  ],
  macros: [
    {
      macro: "proteinas",
      name: "Proteínas",
      unit: "%",
      energy_share_percent: 14,
      min_percent: 10,
      max_percent: 15,
      in_range: true,
    },
    {
      macro: "lipidos",
      name: "Lípidos",
      unit: "%",
      energy_share_percent: 38,
      min_percent: 25,
      max_percent: 35,
      in_range: false,
    },
    {
      macro: "carbohidratos",
      name: "Carbohidratos",
      unit: "%",
      energy_share_percent: 48,
      min_percent: 50,
      max_percent: 65,
      in_range: false,
    },
  ],
  gapa_groups: [
    {
      group: "verduras_y_frutas",
      name: "Verduras y frutas",
      unit: "%",
      energy_share_percent: 6,
      missing: false,
    },
    {
      group: "legumbres_cereales_papa_pan_y_pastas",
      name: "Legumbres, cereales, papa, pan y pastas",
      unit: "%",
      energy_share_percent: 52,
      missing: false,
    },
    {
      group: "leche_yogur_y_quesos",
      name: "Leche, yogur y quesos",
      unit: "%",
      energy_share_percent: 0,
      missing: true,
    },
    {
      group: "carnes_y_huevos",
      name: "Carnes y huevos",
      unit: "%",
      energy_share_percent: 0,
      missing: true,
    },
    {
      group: "aceites_frutas_secas_y_semillas",
      name: "Aceites, frutas secas y semillas",
      unit: "%",
      energy_share_percent: 12,
      missing: false,
    },
    {
      group: "consumo_opcional",
      name: "Consumo opcional",
      unit: "%",
      energy_share_percent: 30,
      missing: false,
    },
  ],
  limits: [
    { code: "sodio", name: "Sodio", unit: "mg", amount_per_1000_kcal: 1200 },
  ],
  top_sources: [
    {
      nutrient: "calcio",
      foods: [
        {
          food_id: "food-leche",
          name: "Leche entera",
          amount_per_100_kcal: 190,
        },
        {
          food_id: "food-yogur",
          name: "Yogur natural",
          amount_per_100_kcal: 175,
        },
        {
          food_id: "food-queso",
          name: "Queso cremoso",
          amount_per_100_kcal: 60,
        },
      ],
    },
    {
      nutrient: "vitamina_b12",
      foods: [
        {
          food_id: "food-higado",
          name: "Hígado vacuno",
          amount_per_100_kcal: 38,
        },
        { food_id: "food-huevo", name: "Huevo", amount_per_100_kcal: 1.2 },
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
  at_risk_nutrients: [
    "Calcio: es clave para el crecimiento de los huesos en la infancia.",
    "Vitamina B12: su falta afecta la sangre y el sistema nervioso.",
  ],
  macros: "Los lípidos superan el rango y los carbohidratos quedan cortos.",
  gapa_groups: "No ingresaron lácteos ni carnes durante el mes.",
  incorporate: "Conviene incorporar leche, yogur o quesos, e hígado o huevo.",
  conclusion: "El aporte de calcio es el principal punto a mejorar.",
  limitations: [
    "Hay alimentos sin valor cargado para algún nutriente en el catálogo: se contaron como cero y el nutriente puede figurar por debajo de lo real.",
  ],
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
