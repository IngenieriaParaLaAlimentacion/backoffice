import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import {
  ME_ENDPOINT,
  ME_ESTABLISHMENTS_ENDPOINT,
  ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT,
  ME_ESTABLISHMENTS_WITHDRAW_ENDPOINT,
} from "@/constants/api";
import { ProfileEstablishment, ProfileResponse } from "@/types/user";

export const DEFAULT_PROFILE: ProfileResponse = {
  id: "user-1",
  email: "admin@example.com",
  name: "Admin",
  last_name: "User",
  role: "admin",
  locality: null,
  contact_phone: null,
  description: null,
  establishments: [],
};

export function makeMeHandler(options?: HandlerOptions<ProfileResponse>) {
  return baseHandler(ME_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_PROFILE, ...options?.data },
  });
}

export function makeUpdateMeHandler(options?: HandlerOptions<ProfileResponse>) {
  return baseHandler(ME_ENDPOINT, {
    ...options,
    method: "patch",
    status: options?.status ?? 200,
    data: { ...DEFAULT_PROFILE, ...options?.data },
  });
}

export function makeMyEstablishmentsHandler(
  options?: HandlerOptions<ProfileEstablishment[]>,
) {
  return baseHandler(ME_ESTABLISHMENTS_ENDPOINT, {
    ...options,
    method: "get",
    status: options?.status ?? 200,
    data: options?.data ?? [],
  });
}

export function makeRequestEstablishmentAccessHandler(
  options?: HandlerOptions<ProfileEstablishment[]>,
) {
  return baseHandler(ME_ESTABLISHMENTS_ENDPOINT, {
    ...options,
    method: "post",
    status: options?.status ?? 201,
    data: options?.data ?? [],
  });
}

export function makeWithdrawEstablishmentAccessHandler(
  options?: HandlerOptions<ProfileEstablishment[]>,
) {
  return baseHandler(ME_ESTABLISHMENTS_WITHDRAW_ENDPOINT, {
    ...options,
    method: "patch",
    status: options?.status ?? 200,
    data: options?.data ?? [],
  });
}

export function makeSubscribeEstablishmentsHandler(
  options?: HandlerOptions<ProfileEstablishment[]>,
) {
  return baseHandler(ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT, {
    ...options,
    method: "post",
    status: options?.status ?? 201,
    data: options?.data ?? [],
  });
}

export function makeUnsubscribeEstablishmentsHandler(
  options?: HandlerOptions<undefined>,
) {
  return baseHandler(ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT, {
    ...options,
    method: "delete",
    status: options?.status ?? 204,
  });
}
