import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import { ME_ENDPOINT } from "@/constants/api";
import { ProfileResponse } from "@/types/user";

const DEFAULT_PROFILE: ProfileResponse = {
  id: "user-1",
  email: "admin@example.com",
  name: "Admin",
  last_name: "User",
  role: "analyst",
  establishments: [],
};

export function makeMeHandler(options?: HandlerOptions<ProfileResponse>) {
  return baseHandler(ME_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_PROFILE, ...options?.data },
  });
}
