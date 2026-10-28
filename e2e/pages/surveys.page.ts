import { waitForApi } from "../support/api";
import {
  DUPLICATE_SURVEY_ENDPOINT,
  FIES_TEMPLATE_ENDPOINT,
  SURVEYS_ENDPOINT,
  SURVEY_ENDPOINT,
  SURVEY_RESPONSES_ENDPOINT,
  SURVEY_STATUS_ENDPOINT,
} from "../../constants/api";
import { expect } from "@playwright/test";
import { SURVEYS_PAGE, SURVEY_FORM } from "../../constants/surveys";
import type {
  PaginatedSurveyResponses,
  SurveyResponse,
  SurveyTemplateResponse,
} from "../../types/survey";

import { SurveyListPage } from "./survey-list.page";

export class SurveysPage extends SurveyListPage {
  async createFies(name: string) {
    await this.page.goto("/dashboard/surveys");
    await this.page
      .getByRole("button", { name: SURVEYS_PAGE.createSurvey, exact: true })
      .click();
    const loaded = waitForApi(this.page, "GET", FIES_TEMPLATE_ENDPOINT);
    await this.page
      .getByRole("dialog")
      .getByRole("link", { name: /^Plantilla FIES/ })
      .click();
    const response = await loaded;
    expect(response.status()).toBe(200);
    const template = (await response.json()) as SurveyTemplateResponse;
    await this.page
      .getByPlaceholder(SURVEY_FORM.namePlaceholder, { exact: true })
      .fill(name);
    const saved = waitForApi(this.page, "POST", SURVEYS_ENDPOINT);
    await this.page
      .getByRole("button", { name: SURVEY_FORM.save, exact: true })
      .click();
    const created = await saved;
    expect(created.status()).toBe(201);
    const survey = (await created.json()) as SurveyResponse;
    await expect(this.page).toHaveURL(`/dashboard/surveys/${survey.id}`);
    await expect(
      this.page.getByRole("heading", {
        name: SURVEY_FORM.editTitle,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByPlaceholder(SURVEY_FORM.namePlaceholder, { exact: true }),
    ).toHaveValue(name);
    return { survey, template };
  }

  async rename(id: string, name: string) {
    await this.page
      .getByPlaceholder(SURVEY_FORM.namePlaceholder, { exact: true })
      .fill(name);
    const saved = waitForApi(this.page, "PUT", SURVEY_ENDPOINT(id));
    await this.page
      .getByRole("button", { name: SURVEY_FORM.save, exact: true })
      .click();
    expect((await saved).status()).toBe(200);
    await expect(this.page).toHaveURL("/dashboard/surveys");
  }

  async search(name: string) {
    await this.open();
    await super.search(name);
  }

  async setActive(id: string, name: string, active: boolean) {
    await this.search(name);
    await this.openActions(name);
    const confirmation = this.page
      .waitForEvent("dialog")
      .then(async (dialog) => {
        expect(dialog.type()).toBe("confirm");
        await dialog.accept();
      });
    const saved = waitForApi(this.page, "PATCH", SURVEY_STATUS_ENDPOINT(id));
    await this.page
      .getByRole("menuitem", {
        name: active ? SURVEY_FORM.activate : SURVEY_FORM.deactivate,
        exact: true,
      })
      .click();
    await confirmation;
    expect((await saved).status()).toBe(200);
    await expect(
      this.row(name).getByRole("cell", {
        name: active ? SURVEYS_PAGE.statusActive : SURVEYS_PAGE.statusInactive,
        exact: true,
      }),
    ).toBeVisible();
  }

  async duplicate(id: string, name: string): Promise<SurveyResponse> {
    await this.search(name);
    await this.openActions(name);
    const saved = waitForApi(this.page, "POST", DUPLICATE_SURVEY_ENDPOINT(id));
    await this.page
      .getByRole("menuitem", { name: SURVEYS_PAGE.duplicate, exact: true })
      .click();
    const response = await saved;
    expect(response.status()).toBe(201);
    const copy = (await response.json()) as SurveyResponse;
    await expect(this.page).toHaveURL(`/dashboard/surveys/${copy.id}`);
    await expect(
      this.page.getByRole("heading", {
        name: SURVEY_FORM.editTitle,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByPlaceholder(SURVEY_FORM.namePlaceholder, { exact: true }),
    ).toHaveValue(copy.name);
    return copy;
  }

  async responses(id: string): Promise<PaginatedSurveyResponses> {
    const loaded = waitForApi(this.page, "GET", SURVEY_RESPONSES_ENDPOINT(id));
    await this.page.goto(`/dashboard/surveys/${id}/responses`);
    const response = await loaded;
    expect(response.status()).toBe(200);
    return (await response.json()) as PaginatedSurveyResponses;
  }
}
