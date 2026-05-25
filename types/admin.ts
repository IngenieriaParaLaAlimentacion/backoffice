export type EstablishmentResponse = {
  id: string;
  name: string;
  address: string;
};

export type UserAdminView = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  role: string;
  status: string;
  establishments: EstablishmentResponse[];
};

export type PaginatedUsersResponse = {
  items: UserAdminView[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type EstablishmentAccessRequest = {
  establishment_ids: string[];
};
