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
import {
  makeCreateEstablishmentHandler,
  makeListEstablishmentsHandler,
} from "@/mocks/handlers/establishment";

export const handlers = [
  makeLoginHandler(),
  makeRefreshHandler(),
  makeResetPasswordHandler(),
  makeForgotPasswordHandler(),
  makeLogoutHandler(),
  makeListUsersHandler(),
  makeApproveEstablishmentsHandler(),
  makeRejectEstablishmentsHandler(),
  makeListEstablishmentsHandler(),
  makeCreateEstablishmentHandler(),
];
