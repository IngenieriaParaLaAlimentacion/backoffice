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
import {
  makeCreateSurveyHandler,
  makeDuplicateSurveyHandler,
  makeFiesTemplateHandler,
  makeGetSurveyHandler,
  makeListSurveysHandler,
  makeUpdateSurveyHandler,
} from "@/mocks/handlers/survey";
import {
  makeListSurveyResponsesHandler,
  makeSurveyResponseDetailHandler,
  makeExportSurveyResponsesHandler,
  makeDashboardIndicatorsHandler,
} from "@/mocks/handlers/surveyResponse";
import { makeMeHandler } from "@/mocks/handlers/user";

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
  makeFiesTemplateHandler(),
  makeDuplicateSurveyHandler(),
  makeUpdateSurveyHandler(),
  makeCreateSurveyHandler(),
  makeListSurveysHandler(),
  makeGetSurveyHandler(),
  makeListSurveyResponsesHandler(),
  makeSurveyResponseDetailHandler(),
  makeExportSurveyResponsesHandler(),
  makeDashboardIndicatorsHandler(),
  makeMeHandler(),
];
