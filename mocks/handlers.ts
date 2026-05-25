import {
  makeForgotPasswordHandler,
  makeLoginHandler,
  makeLogoutHandler,
  makeRefreshHandler,
  makeResetPasswordHandler,
} from "@/mocks/handlers/auth";
import {
  makeApproveEstablishmentsHandler,
  makeListUsersHandler,
  makeRejectEstablishmentsHandler,
} from "@/mocks/handlers/admin";

export const handlers = [
  makeLoginHandler(),
  makeRefreshHandler(),
  makeResetPasswordHandler(),
  makeForgotPasswordHandler(),
  makeLogoutHandler(),
  makeListUsersHandler(),
  makeApproveEstablishmentsHandler(),
  makeRejectEstablishmentsHandler(),
];
