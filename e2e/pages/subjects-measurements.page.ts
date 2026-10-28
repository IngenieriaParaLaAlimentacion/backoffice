import { matchesApiRequest } from "../support/api";
import type { Response, Page } from "@playwright/test";
import { expect } from "../flow-fixtures";
import {
  SUBJECTS_ENDPOINT,
  MEASUREMENTS_ENDPOINT,
  SUBJECT_EVOLUTION_ENDPOINT,
} from "../../constants/api";
import { SUBJECTS_PAGE } from "../../constants/subjects";
import { MEASUREMENTS_PAGE } from "../../constants/measurements";
import type {
  PaginatedSubjectsResponse,
  SubjectSummary,
} from "../../types/subject";
import type {
  PaginatedMeasurementsResponse,
  SubjectEvolutionResponse,
} from "../../types/measurement";

export class SubjectsMeasurementsPage {
  constructor(private readonly page: Page) {}

  get rows() {
    return this.page.locator("table:visible tbody tr");
  }

  private dateInputs(label: string) {
    // These labels exist only in the open FilterPanel, not in its table headers.
    return this.page
      .locator("label")
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator("..")
      .locator('input[type="date"]');
  }

  private listResponse(path: string, params: Record<string, string>) {
    return this.page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        matchesApiRequest(response.request(), "GET", path) &&
        response.status() === 200 &&
        Object.entries(params).every(
          ([key, value]) => url.searchParams.get(key) === value,
        )
      );
    });
  }

  private async renderedList<
    T extends PaginatedSubjectsResponse | PaginatedMeasurementsResponse,
  >(response: Response, emptyText: string): Promise<T> {
    expect(response.status()).toBe(200);
    const listing = (await response.json()) as T;
    if (listing.items.length)
      await expect(this.rows).toHaveCount(listing.items.length);
    else
      await expect(
        this.page.getByText(emptyText, { exact: true }),
      ).toBeVisible();
    return listing;
  }

  private async changeFilter<
    T extends PaginatedSubjectsResponse | PaginatedMeasurementsResponse,
  >(
    path: string,
    params: Record<string, string>,
    emptyText: string,
    change: () => Promise<void>,
  ): Promise<T> {
    // Both screens leave earlier requests in flight. Let each filter render
    // before changing the next so an older response cannot replace the final one.
    const loaded = this.listResponse(path, params);
    await change();
    return this.renderedList<T>(await loaded, emptyText);
  }

  async subjects() {
    const loaded = this.listResponse(SUBJECTS_ENDPOINT, {
      page: "1",
      sort_order: "name_asc",
    });
    await this.page.goto("/dashboard/subjects");
    await this.renderedList<PaginatedSubjectsResponse>(
      await loaded,
      SUBJECTS_PAGE.noSubjects,
    );
    await expect(
      this.page.getByRole("heading", {
        name: SUBJECTS_PAGE.title,
        exact: true,
      }),
    ).toBeVisible();
    await this.page.getByRole("button", { name: /^Filtros/ }).click();
    await expect(this.dateInputs(SUBJECTS_PAGE.filters.birthDate)).toHaveCount(
      2,
    );
  }

  async filterSubjects(search: string, from: string, to: string) {
    const path = SUBJECTS_ENDPOINT;
    const empty = SUBJECTS_PAGE.noSubjects;
    const dates = this.dateInputs(SUBJECTS_PAGE.filters.birthDate);
    await this.changeFilter<PaginatedSubjectsResponse>(
      path,
      { search, page: "1" },
      empty,
      () =>
        this.page
          .getByPlaceholder(SUBJECTS_PAGE.searchPlaceholder, { exact: true })
          .fill(search),
    );
    await this.changeFilter<PaginatedSubjectsResponse>(
      path,
      { search, birth_date_from: from, page: "1" },
      empty,
      () => dates.nth(0).fill(from),
    );
    return this.changeFilter<PaginatedSubjectsResponse>(
      path,
      { search, birth_date_from: from, birth_date_to: to, page: "1" },
      empty,
      () => dates.nth(1).fill(to),
    );
  }

  async nextSubjectsPage(search: string, from: string, to: string) {
    const listing = await this.changeFilter<PaginatedSubjectsResponse>(
      SUBJECTS_ENDPOINT,
      { search, birth_date_from: from, birth_date_to: to, page: "2" },
      SUBJECTS_PAGE.noSubjects,
      () =>
        this.page
          .getByRole("button", { name: "Página siguiente", exact: true })
          .click(),
    );
    await expect(
      this.page.getByText("Página 2 de 2", { exact: true }),
    ).toBeVisible();
    return listing;
  }

  async measurements(
    city: string,
    province: string,
    from: string,
    to: string,
    reload = false,
  ) {
    const path = MEASUREMENTS_ENDPOINT;
    const empty = MEASUREMENTS_PAGE.noMeasurements;
    const loaded = this.listResponse(path, {
      page: "1",
      sort_order: "date_desc",
    });
    // A reload must finish the application bootstrap before another navigation
    // can rotate its refresh token. Arm this read before either navigation.
    if (reload) await this.page.reload();
    else await this.page.goto("/dashboard/anthropometric-measurements");
    await this.renderedList<PaginatedMeasurementsResponse>(await loaded, empty);
    await expect(
      this.page.getByRole("heading", {
        name: MEASUREMENTS_PAGE.title,
        exact: true,
      }),
    ).toBeVisible();
    await this.page.getByRole("button", { name: /^Filtros/ }).click();
    const dates = this.dateInputs(MEASUREMENTS_PAGE.filters.measuredDate);
    await expect(dates).toHaveCount(2);
    await this.changeFilter<PaginatedMeasurementsResponse>(
      path,
      { city, page: "1" },
      empty,
      () =>
        this.page
          .getByPlaceholder(MEASUREMENTS_PAGE.filters.city, { exact: true })
          .fill(city),
    );
    await this.changeFilter<PaginatedMeasurementsResponse>(
      path,
      { city, province, page: "1" },
      empty,
      () =>
        this.page
          .getByPlaceholder(MEASUREMENTS_PAGE.filters.province, { exact: true })
          .fill(province),
    );
    await this.changeFilter<PaginatedMeasurementsResponse>(
      path,
      { city, province, measured_from: from, page: "1" },
      empty,
      () => dates.nth(0).fill(from),
    );
    return this.changeFilter<PaginatedMeasurementsResponse>(
      path,
      { city, province, measured_from: from, measured_to: to, page: "1" },
      empty,
      () => dates.nth(1).fill(to),
    );
  }

  async evolution(
    subject: Pick<SubjectSummary, "id" | "name" | "last_name" | "dni">,
  ) {
    const response = this.page.waitForResponse(
      (result) =>
        matchesApiRequest(
          result.request(),
          "GET",
          SUBJECT_EVOLUTION_ENDPOINT(subject.id),
        ) && result.status() === 200,
    );
    // Three measurement rows share this subject; choose the top chronological row explicitly.
    const matching = this.rows.filter({ hasText: `(${subject.dni})` });
    await expect(matching).toHaveCount(3);
    await matching.first().click();
    const data = (await (await response).json()) as SubjectEvolutionResponse;
    const dialog = this.page.getByRole("dialog", {
      name: `${subject.name} ${subject.last_name}`,
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(String(subject.dni), { exact: true }),
    ).toBeVisible();
    await expect(
      dialog
        .getByText(MEASUREMENTS_PAGE.detail.measurementsCount, { exact: true })
        .locator("..")
        .locator("span")
        .last(),
    ).toHaveText("3");
    await expect(
      dialog.getByText(MEASUREMENTS_PAGE.detail.chartTitle, { exact: true }),
    ).toBeVisible();
    const legend = dialog
      .getByRole("region", {
        name: MEASUREMENTS_PAGE.detail.chartTitle,
        exact: true,
      })
      .getByRole("list");
    for (const series of [
      MEASUREMENTS_PAGE.columns.weight,
      MEASUREMENTS_PAGE.columns.height,
      MEASUREMENTS_PAGE.columns.bmi,
    ]) {
      await expect(legend.getByText(series, { exact: true })).toBeVisible();
    }
    return data;
  }
}
