export type EstablishmentResponse = {
  id: string;
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  city: string;
  province: string;
};

export type EstablishmentSortOrder =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "city_asc"
  | "city_desc"
  | "province_asc"
  | "province_desc";

export type UserAdminView = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  role: string;
  status: string;
  establishments: EstablishmentResponse[];
};

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  last_name?: string;
  role?: string;
  status?: string;
  establishments?: EstablishmentResponse[];
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

export type InviteAdminResponse = {
  user_id: string;
};
