import {
  makeForgotPasswordHandler,
  makeLoginHandler,
  makeLogoutHandler,
  makeRefreshHandler,
  makeResetPasswordHandler,
  makeVerifyEmailHandler,
} from "@/mocks/handlers/auth";
import {
  makeApproveEstablishmentRequestHandler,
  makeApproveEstablishmentsHandler,
  makeListEstablishmentRequestsHandler,
  makeApproveFieldWorkerHandler,
  makeListPendingEstablishmentAccessHandler,
  makeListUsersHandler,
  makeRejectEstablishmentRequestHandler,
  makeRejectEstablishmentsHandler,
  makeRejectFieldWorkerHandler,
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
import { makeExportSubjectsHandler } from "@/mocks/handlers/csvExport";
import { makeMeHandler } from "@/mocks/handlers/user";

export const handlers = [
  makeLoginHandler(),
  makeRefreshHandler(),
  makeResetPasswordHandler(),
  makeForgotPasswordHandler(),
  makeVerifyEmailHandler(),
  makeLogoutHandler(),
  makeListUsersHandler(),
  makeListPendingEstablishmentAccessHandler(),
  makeApproveFieldWorkerHandler(),
  makeRejectFieldWorkerHandler(),
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
  makeExportSubjectsHandler(),
  makeMeHandler(),
];
