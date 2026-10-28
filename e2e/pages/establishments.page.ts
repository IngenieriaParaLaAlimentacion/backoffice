import { waitForApi, matchesApiRequest } from "../support/api";
import {
  ESTABLISHMENTS_ENDPOINT,
  ESTABLISHMENT_ENDPOINT,
} from "../../constants/api";
import { expect, type Locator, type Page } from "@playwright/test";
import {
  CREATE_ESTABLISHMENT_PAGE,
  EDIT_ESTABLISHMENT_DIALOG,
  ESTABLISHMENTS_LIST_PAGE,
} from "../../constants/establishments";
import { GEOREF_SEARCH_PLACEHOLDER } from "../../constants/georef";
import type { EstablishmentResponse } from "../../types/establishment";

export class EstablishmentsPage {
  constructor(readonly page: Page) {}

  async newEstablishment() {
    await this.page.goto("/dashboard/establishments");
    await this.page
      .getByRole("link", {
        name: ESTABLISHMENTS_LIST_PAGE.createButton,
        exact: true,
      })
      .click();
    await expect(this.page).toHaveURL(/\/dashboard\/establishments\/create$/);
  }

  async pickAddress(
    formattedAddress: string,
    scope: Page | Locator = this.page,
  ) {
    const input = scope.getByPlaceholder(GEOREF_SEARCH_PLACEHOLDER, {
      exact: true,
    });
    await input.fill(formattedAddress);
    await input
      .locator("..")
      .locator("ul > li")
      .filter({ hasText: formattedAddress })
      .click();
  }

  async create(
    name: string,
    formattedAddress: string,
  ): Promise<EstablishmentResponse> {
    await this.page.getByRole("textbox", { name: /^Nombre\s*\*?$/ }).fill(name);
    await this.pickAddress(formattedAddress);
    const saved = waitForApi(this.page, "POST", ESTABLISHMENTS_ENDPOINT);
    await this.page
      .getByRole("button", {
        name: CREATE_ESTABLISHMENT_PAGE.submitButton,
        exact: true,
      })
      .click();
    const response = await saved;
    expect(response.status()).toBe(201);
    const establishment = (await response.json()) as EstablishmentResponse;
    await expect(this.page).toHaveURL(/\/dashboard\/establishments(?:\?.*)?$/);
    return establishment;
  }

  async search(name: string) {
    const loaded = this.page.waitForResponse((r) => {
      const url = new URL(r.url());
      return (
        matchesApiRequest(r.request(), "GET", ESTABLISHMENTS_ENDPOINT) &&
        url.searchParams.get("search") === name
      );
    });
    await this.page
      .getByPlaceholder(ESTABLISHMENTS_LIST_PAGE.searchPlaceholder, {
        exact: true,
      })
      .fill(name);
    expect((await loaded).ok()).toBeTruthy();
  }

  row(name: string) {
    return this.page
      .getByRole("table")
      .getByRole("row")
      .filter({ has: this.page.getByRole("link", { name, exact: true }) });
  }

  async open(id: string, name: string) {
    await this.page.goto(`/dashboard/establishments/${id}`);
    await expect(
      this.page.getByRole("heading", { level: 1, name, exact: true }),
    ).toBeVisible();
  }

  async edit(id: string, name: string, formattedAddress: string) {
    await this.page
      .getByRole("button", {
        name: EDIT_ESTABLISHMENT_DIALOG.button,
        exact: true,
      })
      .click();
    const dialog = this.page.getByRole("dialog", {
      name: EDIT_ESTABLISHMENT_DIALOG.title,
    });
    await dialog.getByRole("textbox", { name: /^Nombre\s*\*?$/ }).fill(name);
    await dialog
      .getByRole("button", {
        name: EDIT_ESTABLISHMENT_DIALOG.changeAddress,
        exact: true,
      })
      .click();
    await this.pickAddress(formattedAddress, dialog);
    const saved = waitForApi(this.page, "PATCH", ESTABLISHMENT_ENDPOINT(id));
    await dialog
      .getByRole("button", {
        name: EDIT_ESTABLISHMENT_DIALOG.save,
        exact: true,
      })
      .click();
    expect((await saved).status()).toBe(200);
    await expect(dialog).toBeHidden();
  }
}
