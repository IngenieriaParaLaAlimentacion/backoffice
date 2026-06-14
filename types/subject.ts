export type Sex = "male" | "female";

export type SubjectSummary = {
  id: string;
  dni: number;
  name: string;
  last_name: string;
  sex: Sex;
};

export type PaginatedSubjectsResponse = {
  items: SubjectSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type SubjectDetail = {
  id: string;
  dni: number;
  name: string;
  last_name: string;
  sex: Sex;
  birth_date: string;
  is_rural: boolean;
  is_indigenous: boolean;
};

export type SubjectSortField = "name" | "created_at" | "last_survey_date";

export type SortOrder = "asc" | "desc";
