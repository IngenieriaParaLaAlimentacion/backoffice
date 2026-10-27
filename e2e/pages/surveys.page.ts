import {
  DUPLICATE_SURVEY_ENDPOINT,
  FIES_TEMPLATE_ENDPOINT,
  SURVEYS_ENDPOINT,
  SURVEY_ENDPOINT,
  SURVEY_RESPONSES_ENDPOINT,
  SURVEY_STATUS_ENDPOINT,
} from "../../constants/api";
import { expect, type Page } from "@playwright/test";
import { SURVEYS_PAGE, SURVEY_FORM } from "../../constants/surveys";
import type {
  PaginatedSurveyResponses,
  PaginatedSurveysResponse,
  SurveyResponse,
  SurveyTemplateResponse,
} from "../../types/survey";

export class SurveysPage {
  constructor(readonly page: Page) {}

  async createFies(name: string) {
    await this.page.goto("/dashboard/surveys");
    await this.page
      .getByRole("button", { name: "Crear encuesta", exact: true })
      .click();
    const loaded = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === FIES_TEMPLATE_ENDPOINT &&
        r.request().method() === "GET",
    );
    await this.page
      .getByRole("dialog")
      .getByRole("link", { name: /^Plantilla FIES/ })
      .click();
    const response = await loaded;
    expect(response.status()).toBe(200);
    const template = (await response.json()) as SurveyTemplateResponse;
    await this.page
      .getByPlaceholder("Nombre de la encuesta", { exact: true })
      .fill(name);
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === SURVEYS_ENDPOINT &&
        r.request().method() === "POST",
    );
    await this.page
      .getByRole("button", { name: "Guardar", exact: true })
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
      this.page.getByPlaceholder("Nombre de la encuesta", { exact: true }),
    ).toHaveValue(name);
    return { survey, template };
  }

  async rename(id: string, name: string) {
    await this.page
      .getByPlaceholder("Nombre de la encuesta", { exact: true })
      .fill(name);
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === SURVEY_ENDPOINT(id) &&
        r.request().method() === "PUT",
    );
    await this.page
      .getByRole("button", { name: "Guardar", exact: true })
      .click();
    expect((await saved).status()).toBe(200);
    await expect(this.page).toHaveURL("/dashboard/surveys");
  }

  async search(name: string) {
    // Let the initial request render before typing: this list fetches on
    // every search change and does not cancel earlier in-flight requests.
    const initial = this.page.waitForResponse((r) => {
      const url = new URL(r.url());
      return (
        url.pathname === SURVEYS_ENDPOINT &&
        !url.searchParams.has("search") &&
        r.request().method() === "GET"
      );
    });
    await this.page.goto("/dashboard/surveys");
    const response = await initial;
    expect(response.status()).toBe(200);
    const listing = (await response.json()) as PaginatedSurveysResponse;
    if (listing.items.length > 0) {
      await expect(
        this.page.getByRole("table").locator("tbody tr"),
      ).toHaveCount(listing.items.length);
    } else {
      await expect(
        this.page.getByText(SURVEYS_PAGE.noSurveys, { exact: true }),
      ).toBeVisible();
    }
    const loaded = this.page.waitForResponse((r) => {
      const url = new URL(r.url());
      return (
        url.pathname === SURVEYS_ENDPOINT &&
        url.searchParams.get("search") === name &&
        r.request().method() === "GET"
      );
    });
    await this.page
      .getByPlaceholder("Buscar por nombre", { exact: true })
      .fill(name);
    expect((await loaded).status()).toBe(200);
    await expect(this.row(name)).toBeVisible();
  }

  row(name: string) {
    return this.page
      .getByRole("table")
      .getByRole("row")
      .filter({
        has: this.page.getByRole("cell", { name, exact: true }),
      });
  }

  async setActive(id: string, name: string, active: boolean) {
    await this.search(name);
    await this.row(name).getByTitle("Más acciones", { exact: true }).click();
    const confirmation = this.page
      .waitForEvent("dialog")
      .then(async (dialog) => {
        expect(dialog.type()).toBe("confirm");
        await dialog.accept();
      });
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === SURVEY_STATUS_ENDPOINT(id) &&
        r.request().method() === "PATCH",
    );
    await this.page
      .getByRole("menuitem", {
        name: active ? "Activar" : "Desactivar",
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
    await this.row(name).getByTitle("Más acciones", { exact: true }).click();
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === DUPLICATE_SURVEY_ENDPOINT(id) &&
        r.request().method() === "POST",
    );
    await this.page
      .getByRole("menuitem", { name: "Duplicar", exact: true })
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
      this.page.getByPlaceholder("Nombre de la encuesta", { exact: true }),
    ).toHaveValue(copy.name);
    return copy;
  }

  async responses(id: string): Promise<PaginatedSurveyResponses> {
    const loaded = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === SURVEY_RESPONSES_ENDPOINT(id) &&
        r.request().method() === "GET",
    );
    await this.page.goto(`/dashboard/surveys/${id}/responses`);
    const response = await loaded;
    expect(response.status()).toBe(200);
    return (await response.json()) as PaginatedSurveyResponses;
  }
}
