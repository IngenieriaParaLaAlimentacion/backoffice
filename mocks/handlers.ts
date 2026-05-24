import {
  makeForgotPasswordHandler,
  makeLoginHandler,
  makeLogoutHandler,
  makeRefreshHandler,
  makeResetPasswordHandler,
} from "@/mocks/handlers/auth";

export const handlers = [
  makeLoginHandler(),
  makeRefreshHandler(),
  makeResetPasswordHandler(),
  makeForgotPasswordHandler(),
  makeLogoutHandler(),
];
