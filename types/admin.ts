import { UserRole } from "@/types/user";
import {
  EstablishmentCharacterization,
  EstablishmentResponse,
  EstablishmentRequestStatus,
} from "@/types/establishment";

export type UserAdminView = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  role: UserRole;
  status: string;
  is_email_verified: boolean;
  establishments: EstablishmentResponse[];
};

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  last_name?: string;
  role?: UserRole;
  status?: string;
  establishments?: EstablishmentResponse[];
  locality?: string;
  description?: string;
  contact_phone?: string;
};

export type ChangeUserRoleRequest = {
  role: UserRole;
};

export type PaginatedUsersResponse = {
  items: UserAdminView[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type PendingEstablishmentAccessResponse = PaginatedUsersResponse & {
  total_pending_establishments: number;
};

export type EstablishmentAccessRequest = {
  establishment_ids: string[];
};

export type UserAccessRequest = {
  establishment_ids: string[];
};

export type InviteAdminResponse = {
  user_id: string;
};

export type EstablishmentRequestAdminView = {
  id: string;
  user_id: string;
  name: string;
  formatted_address: string;
  city: string | null;
  province: string | null;
  status: EstablishmentRequestStatus;
  created_at: string;
  requester_name: string;
  requester_last_name: string;
  requester_email: string;
  reviewed_by: string | null;
  updated_at: string;
  /** The profile the requester proposed, if any. Approving stores it as is;
   * the admin corrects it afterwards from the establishment's Perfil tab. */
  characterization: EstablishmentCharacterization | null;
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
