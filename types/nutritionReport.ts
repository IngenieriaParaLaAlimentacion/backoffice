/** A calendar month as `YYYY-MM`, the key of a report. */
export type ReportMonth = string;

/** `unavailable` means the AI failed: the figures are saved, the text isn't.
 * `not_applicable` is a month without intakes, which never calls the AI. */
export type SummaryStatus = "generated" | "unavailable" | "not_applicable";

export type PrioritizedNutrient =
  | "calcio"
  | "vitamina_a"
  | "folato"
  | "vitamina_b12"
  | "vitamina_c"
  | "hierro"
  | "zinc";

export type Macronutrient = "proteinas" | "lipidos" | "carbohidratos";

export type GapaGroup =
  | "verduras_y_frutas"
  | "legumbres_cereales_papa_pan_y_pastas"
  | "leche_yogur_y_quesos"
  | "carnes_y_huevos"
  | "aceites_frutas_secas_y_semillas"
  | "consumo_opcional";

export type NutritionReportListItem = {
  id: string;
  month: ReportMonth;
  has_data: boolean;
  summary_status: SummaryStatus;
  created_at: string;
};

export type PaginatedNutritionReportsResponse = {
  items: NutritionReportListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type NutritionReportSortOrder = "month_desc" | "month_asc";

/** The Spanish name and unit the backend prints next to each code. */
type Named = { name: string; unit: string };

export type ReportNutrient = Named & {
  nutrient: PrioritizedNutrient;
  amount_per_1000_kcal: number;
  reference_per_1000_kcal: number;
  /** Two thirds of the reference: below it the nutrient is `at_risk`. */
  minimum_per_1000_kcal: number;
  adequacy_percent: number;
  adequacy_capped_percent: number;
  at_risk: boolean;
};

export type ReportMacro = Named & {
  macro: Macronutrient;
  energy_share_percent: number;
  min_percent: number;
  max_percent: number;
  in_range: boolean;
};

export type ReportGapaGroup = Named & {
  group: GapaGroup;
  energy_share_percent: number;
  missing: boolean;
};

export type ReportLimit = Named & {
  code: string;
  amount_per_1000_kcal: number;
};

export type ReportFoodSource = {
  food_id: string;
  name: string;
  amount_per_100_kcal: number;
};

export type ReportNutrientSources = {
  nutrient: PrioritizedNutrient;
  foods: ReportFoodSource[];
};

export type ReportFoodWithoutConversion = {
  food_id: string;
  name: string;
};

export type NutritionReportAnalysis = {
  /** Null in a month without intakes. */
  energy_kcal: number | null;
  /** The month's composite indicator. Null in a month without intakes. */
  mean_adequacy_percent: number | null;
  nutrients: ReportNutrient[];
  macros: ReportMacro[];
  gapa_groups: ReportGapaGroup[];
  limits: ReportLimit[];
  top_sources: ReportNutrientSources[];
  foods_without_conversion: ReportFoodWithoutConversion[];
  /** Data gaps found while calculating, such as foods left out. */
  warnings: string[];
};

export type NutritionReportSummary = {
  overview: string;
  at_risk_nutrients: string[];
  macros: string;
  gapa_groups: string;
  incorporate: string;
  conclusion: string;
  limitations: string[];
};

export type NutritionReportResponse = {
  id: string;
  establishment_id: string;
  month: ReportMonth;
  has_data: boolean;
  reference_profile: string;
  analysis: NutritionReportAnalysis;
  summary_status: SummaryStatus;
  /** Null unless `summary_status` is `generated`. */
  summary: NutritionReportSummary | null;
  /** Fixed by the backend, never written by the AI. Absent in a month
   * without intakes. */
  scope_note?: string | null;
  created_at: string;
  updated_at: string;
};
