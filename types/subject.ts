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
