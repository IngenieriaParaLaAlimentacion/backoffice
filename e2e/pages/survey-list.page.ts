import { expect, type Page } from "@playwright/test";
import { SURVEYS_ENDPOINT } from "../../constants/api";
import { SURVEYS_PAGE } from "../../constants/surveys";
import type { PaginatedSurveysResponse } from "../../types/survey";
import { matchesApiRequest, waitForApi } from "../support/api";

export class SurveyListPage {
  constructor(readonly page: Page) {}

  async open(reload = false): Promise<void> {
    const loaded = waitForApi(this.page, "GET", SURVEYS_ENDPOINT);
    if (reload) await this.page.reload();
    else await this.page.goto("/dashboard/surveys");
    const response = await loaded;
    expect(response.status()).toBe(200);
    const listing = (await response.json()) as PaginatedSurveysResponse;
    await expect(
      this.page.getByRole("heading", { name: SURVEYS_PAGE.title, exact: true }),
    ).toBeVisible();
    // The list does not cancel earlier requests; render the initial result
    // before typing so it cannot replace the subsequent search result.
    if (listing.items.length)
      await expect(
        this.page.getByRole("table").locator("tbody tr"),
      ).toHaveCount(listing.items.length);
    else
      await expect(
        this.page.getByText(SURVEYS_PAGE.noSurveys, { exact: true }),
      ).toBeVisible();
  }

  row(name: string) {
    return this.page
      .getByRole("table")
      .getByRole("row")
      .filter({
        has: this.page.getByRole("cell", { name, exact: true }),
      });
  }

  async search(name: string): Promise<void> {
    const loaded = this.page.waitForResponse(
      (response) =>
        matchesApiRequest(response.request(), "GET", SURVEYS_ENDPOINT) &&
        new URL(response.url()).searchParams.get("search") === name,
    );
    await this.page
      .getByPlaceholder(SURVEYS_PAGE.searchPlaceholder, { exact: true })
      .fill(name);
    expect((await loaded).status()).toBe(200);
    await expect(this.row(name)).toBeVisible();
  }

  async openActions(name: string): Promise<void> {
    await this.row(name)
      .getByRole("button", { name: SURVEYS_PAGE.actionsMenuLabel, exact: true })
      .click();
    await expect(this.page.getByRole("menu")).toBeVisible();
  }
}
