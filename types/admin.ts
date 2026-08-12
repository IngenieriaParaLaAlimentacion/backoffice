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
  locality?: string;
  description?: string;
  contact_phone?: string;
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

export type EstablishmentRequestStatus = "pending" | "approved" | "rejected";

export type EstablishmentRequestAdminView = {
  id: string;
  user_id: string;
  name: string | null;
  formatted_address: string | null;
  city: string | null;
  province: string | null;
  status: EstablishmentRequestStatus;
  created_at: string;
  requester_name: string;
  requester_last_name: string;
  requester_email: string;
  reviewed_by: string | null;
  updated_at: string;
};

export type PaginatedEstablishmentRequestsResponse = {
  items: EstablishmentRequestAdminView[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type EstablishmentApprovalResponse = EstablishmentResponse & {
  reused: boolean;
};
