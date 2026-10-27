import {
  ESTABLISHMENTS_ENDPOINT,
  ESTABLISHMENT_ENDPOINT,
} from "../../constants/api";
import { expect, type Locator, type Page } from "@playwright/test";
import type { EstablishmentResponse } from "../../types/establishment";

export class EstablishmentsPage {
  constructor(readonly page: Page) {}

  async newEstablishment() {
    await this.page.goto("/dashboard/establishments");
    await this.page
      .getByRole("link", { name: "Nuevo establecimiento", exact: true })
      .click();
    await expect(this.page).toHaveURL(/\/dashboard\/establishments\/create$/);
  }

  async pickAddress(
    formattedAddress: string,
    scope: Page | Locator = this.page,
  ) {
    await scope
      .getByPlaceholder("Ej: Av. Mitre, Avellaneda Buenos Aires", {
        exact: true,
      })
      .fill(formattedAddress);
    await scope.locator("li").filter({ hasText: formattedAddress }).click();
  }

  async create(
    name: string,
    formattedAddress: string,
  ): Promise<EstablishmentResponse> {
    await this.page.getByRole("textbox", { name: /^Nombre\s*\*?$/ }).fill(name);
    await this.pickAddress(formattedAddress);
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === ESTABLISHMENTS_ENDPOINT &&
        r.request().method() === "POST",
    );
    await this.page
      .getByRole("button", { name: "Crear establecimiento", exact: true })
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
        url.pathname === ESTABLISHMENTS_ENDPOINT &&
        url.searchParams.get("search") === name &&
        r.request().method() === "GET"
      );
    });
    await this.page
      .getByPlaceholder("Nombre o dirección", { exact: true })
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
      .getByRole("button", { name: "Editar datos", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", {
      name: "Editar datos del establecimiento",
    });
    await dialog.getByRole("textbox", { name: /^Nombre\s*\*?$/ }).fill(name);
    await dialog
      .getByRole("button", { name: "Cambiar dirección", exact: true })
      .click();
    await this.pickAddress(formattedAddress, dialog);
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === ESTABLISHMENT_ENDPOINT(id) &&
        r.request().method() === "PATCH",
    );
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect(dialog).toBeHidden();
  }
}
