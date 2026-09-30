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
  makeApproveFieldWorkerHandler,
  makeListPendingEstablishmentAccessHandler,
  makeListUsersHandler,
  makeRejectEstablishmentRequestHandler,
  makeRejectEstablishmentsHandler,
  makeRejectFieldWorkerHandler,
} from "@/mocks/handlers/admin";
import {
  makeCreateEstablishmentHandler,
  makeCreateEstablishmentRequestHandler,
  makeEstablishmentDashboardHandler,
  makeEstablishmentFieldWorkersHandler,
  makeEstablishmentFoodMovementDetailHandler,
  makeEstablishmentFoodMovementsHandler,
  makeEstablishmentStockHandler,
  makeEstablishmentSubjectsHandler,
  makeEstablishmentsMapHandler,
  makeExportEstablishmentStockHandler,
  makeListEstablishmentsHandler,
} from "@/mocks/handlers/establishment";
import {
  makeListFoodCategoriesHandler,
  makeListFoodsHandler,
} from "@/mocks/handlers/foodCatalog";
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
import {
  makeFoodIntakeHandler,
  makeFoodOutflowHandler,
} from "@/mocks/handlers/foodMovement";

export const handlers = [
  makeLoginHandler(),
  makeRefreshHandler(),
  makeResetPasswordHandler(),
  makeForgotPasswordHandler(),
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
  makeEstablishmentFoodMovementsHandler(),
  makeEstablishmentFoodMovementDetailHandler(),
  makeEstablishmentStockHandler(),
  makeFoodIntakeHandler(),
  makeFoodOutflowHandler(),
  makeExportEstablishmentStockHandler(),
  makeListFoodCategoriesHandler(),
  makeListFoodsHandler(),
  makeListEstablishmentsHandler(),
  makeEstablishmentsMapHandler(),
  makeCreateEstablishmentHandler(),
  makeCreateEstablishmentRequestHandler(),
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
