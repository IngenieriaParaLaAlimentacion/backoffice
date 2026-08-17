import {
  makeForgotPasswordHandler,
  makeLoginHandler,
  makeLogoutHandler,
  makeRefreshHandler,
  makeResetPasswordHandler,
} from "@/mocks/handlers/auth";
import {
  makeApproveEstablishmentRequestHandler,
  makeApproveEstablishmentsHandler,
  makeListEstablishmentRequestsHandler,
  makeListUsersHandler,
  makeRejectEstablishmentRequestHandler,
  makeRejectEstablishmentsHandler,
} from "@/mocks/handlers/admin";
import {
  makeCreateEstablishmentHandler,
  makeEstablishmentDashboardHandler,
  makeEstablishmentFieldWorkersHandler,
  makeEstablishmentSubjectsHandler,
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
  makeListEstablishmentRequestsHandler(),
  makeApproveEstablishmentRequestHandler(),
  makeRejectEstablishmentRequestHandler(),
  makeEstablishmentDashboardHandler(),
  makeEstablishmentSubjectsHandler(),
  makeEstablishmentFieldWorkersHandler(),
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
