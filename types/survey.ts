export type SurveyScope = "generic" | "targeted";

export type SurveySortOrder = "name_asc" | "name_desc" | "newest" | "oldest";

export type SurveyListItem = {
  id: string;
  name: string;
  scope: SurveyScope;
  is_active: boolean;
  created_by_id: string;
  question_count: number;
  created_at: string; // date-time
};

export type PaginatedSurveysResponse = {
  items: SurveyListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ResponseType =
  | "text"
  | "single_choice"
  | "multiple_choice"
  | "numeric"
  | "date";

// --- Option / Question payload + response shapes ---

export type OptionInput = {
  id?: string | null; // existing option id when editing; omit to create
  text: string;
};

export type OptionResponse = {
  id: string;
  text: string;
  position: number;
};

export type QuestionInput = {
  id?: string | null; // existing question id when editing; omit to create
  text: string;
  response_type: ResponseType;
  is_required: boolean;
  options?: OptionInput[];
};

export type QuestionResponse = {
  id: string;
  text: string;
  response_type: ResponseType;
  is_required: boolean;
  position: number;
  options: OptionResponse[];
};

// --- Survey detail + create/update payloads ---

export type SurveyResponse = {
  id: string;
  name: string;
  description: string | null;
  scope: SurveyScope;
  is_active: boolean;
  created_by_id: string;
  response_count: number;
  questions: QuestionResponse[];
  establishment_ids: string[];
  created_at: string;
  updated_at: string;
};

export type SurveyCreateRequest = {
  name: string;
  description?: string | null;
  scope: SurveyScope;
  questions: QuestionInput[];
  establishment_ids: string[];
};

export type SurveyUpdateRequest = SurveyCreateRequest;

export type SurveyStatusRequest = {
  is_active: boolean;
};

// --- FIES template ---

export type TemplateOption = {
  text: string;
  position: number;
};

export type TemplateQuestion = {
  text: string;
  response_type: ResponseType;
  is_required: boolean;
  position: number;
  options: TemplateOption[];
};

export type SurveyTemplateResponse = {
  name: string;
  description: string | null;
  scope: SurveyScope;
  questions: TemplateQuestion[];
};

// --- Survey Response types (Dashboard) ---

export type SurveyRef = { id: string; name: string };
export type UserRef = { id: string; name: string };
export type EstablishmentRef = {
  id: string;
  name: string;
  city: string;
  province: string;
};

export type SurveyResponseDashboardItem = {
  id: string;
  event_at: string;
  survey: SurveyRef;
  establishment: EstablishmentRef;
  submitted_by: UserRef;
  score_fies: number | null;
};

export type PaginatedSurveyResponses = {
  items: SurveyResponseDashboardItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type QuestionAnswer = {
  question_id: string;
  question_text: string;
  response_type: ResponseType;
  value: string | number | string[] | null;
  value_label: string | string[] | null;
};

export type SurveyResponseDetail = {
  id: string;
  event_at: string;
  survey: SurveyRef;
  establishment: EstablishmentRef;
  submitted_by: UserRef;
  score_fies: number | null;
  answers: QuestionAnswer[];
};

export type DashboardIndicators = {
  response_count: number;
  participating_establishments_count: number;
  last_event_at: string | null;
};
