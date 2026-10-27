import {
  APPROVE_ESTABLISHMENTS_ENDPOINT,
  APPROVE_ESTABLISHMENT_REQUEST_ENDPOINT,
  APPROVE_FIELD_WORKER_ENDPOINT,
  LIST_USERS_ENDPOINT,
  REJECT_ESTABLISHMENT_REQUEST_ENDPOINT,
  REVOKE_ESTABLISHMENTS_ENDPOINT,
} from "../../constants/api";
import { expect, type Page } from "@playwright/test";
import type {
  EstablishmentApprovalResponse,
  PaginatedUsersResponse,
} from "../../types/admin";
import { ESTABLISHMENT_DASHBOARD_PAGE } from "../../constants/establishments";

export class RequestsPage {
  constructor(readonly page: Page) {}

  row(value: string) {
    return this.page
      .getByRole("table")
      .getByRole("row")
      .filter({
        has: this.page.getByRole("cell", { name: value, exact: true }),
      });
  }

  async creation(name: string) {
    await this.page.goto(
      `/dashboard/requests/establishment-creations?search=${encodeURIComponent(name)}`,
    );
    await this.row(name)
      .getByRole("button", { name: "Revisar", exact: true })
      .click();
    return this.page.getByRole("dialog");
  }

  async approveCreation(
    id: string,
    name: string,
    address: string,
  ): Promise<EstablishmentApprovalResponse> {
    const dialog = await this.creation(name);
    await dialog
      .getByPlaceholder("Ej: Av. Mitre, Avellaneda Buenos Aires", {
        exact: true,
      })
      .fill(address);
    await dialog.locator("li").filter({ hasText: address }).click();
    await dialog.getByRole("button", { name: "Aprobar", exact: true }).click();
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname ===
          APPROVE_ESTABLISHMENT_REQUEST_ENDPOINT(id) &&
        r.request().method() === "PATCH",
    );
    await dialog
      .getByRole("button", { name: "Confirmar alta", exact: true })
      .click();
    const response = await saved;
    expect(response.status()).toBe(200);
    await expect(dialog).toBeHidden();
    await expect(this.row(name)).toHaveCount(0);
    return (await response.json()) as EstablishmentApprovalResponse;
  }

  async rejectCreation(id: string, name: string) {
    const dialog = await this.creation(name);
    await dialog.getByRole("button", { name: "Rechazar", exact: true }).click();
    await dialog
      .getByPlaceholder("Ej: Datos incompletos, comedor duplicado...", {
        exact: true,
      })
      .fill("E2E fictional request rejected");
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname ===
          REJECT_ESTABLISHMENT_REQUEST_ENDPOINT(id) &&
        r.request().method() === "PATCH",
    );
    await dialog
      .getByRole("button", { name: "Confirmar rechazo", exact: true })
      .click();
    expect((await saved).status()).toBe(204);
    await expect(dialog).toBeHidden();
    await expect(this.row(name)).toHaveCount(0);
  }

  async activateWorker(id: string, email: string) {
    const queueResponse = (pageNumber: number) =>
      this.page.waitForResponse((r) => {
        const url = new URL(r.url());
        return (
          url.pathname === LIST_USERS_ENDPOINT &&
          url.searchParams.get("status") === "pending_validation" &&
          url.searchParams.get("role") === "field_worker" &&
          // The tab badges request page_size=1 from the same endpoint.
          url.searchParams.get("page_size") === "20" &&
          url.searchParams.get("page") === String(pageNumber) &&
          r.request().method() === "GET"
        );
      });
    let loaded = queueResponse(1);
    await this.page.goto("/dashboard/requests");
    let response = await loaded;
    expect(response.status()).toBe(200);
    let queue = (await response.json()) as PaginatedUsersResponse;
    let current = 1;
    while (!queue.items.some((user) => user.id === id)) {
      expect(
        current,
        `Owned pending worker ${email} was not found`,
      ).toBeLessThan(queue.total_pages);
      await expect(
        this.page.getByText(`Página ${current} de ${queue.total_pages}`, {
          exact: true,
        }),
      ).toBeVisible();
      loaded = queueResponse(current + 1);
      await this.page
        .getByRole("button", { name: "Página siguiente", exact: true })
        .click();
      response = await loaded;
      expect(response.status()).toBe(200);
      queue = (await response.json()) as PaginatedUsersResponse;
      current += 1;
    }
    await this.row(email)
      .getByRole("button", { name: "Revisar", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog");
    await expect(dialog.getByText(email, { exact: true })).toBeVisible();
    // Leave every establishment undecided: this transition activates only the account.
    await dialog
      .getByRole("button", { name: "Aceptar solicitud", exact: true })
      .click();
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === APPROVE_FIELD_WORKER_ENDPOINT(id) &&
        r.request().method() === "PATCH",
    );
    await dialog
      .getByRole("button", { name: "Confirmar aceptación", exact: true })
      .click();
    const responseSaved = await saved;
    expect(responseSaved.status()).toBe(204);
    expect(responseSaved.request().postDataJSON()).toEqual({
      establishment_ids: [],
    });
    await expect(dialog).toBeHidden();
  }

  async approveAccess(id: string, email: string, establishment: string) {
    await this.page.goto(
      `/dashboard/requests/establishments?search=${encodeURIComponent(email)}`,
    );
    await this.row(email)
      .getByRole("button", { name: "Revisar", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog");
    const card = dialog.locator("div.rounded-lg.border").filter({
      has: this.page.getByText(establishment, { exact: true }),
    });
    await card.getByRole("button", { name: "Aceptar", exact: true }).click();
    await dialog
      .getByRole("button", { name: "Aplicar cambios", exact: true })
      .click();
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === APPROVE_ESTABLISHMENTS_ENDPOINT(id) &&
        r.request().method() === "PATCH",
    );
    await dialog
      .getByRole("button", { name: "Confirmar cambios", exact: true })
      .click();
    expect((await saved).status()).toBe(204);
    await expect(dialog).toBeHidden();
  }

  async revoke(id: string, email: string, establishmentId: string) {
    await this.page.goto(
      `/dashboard/establishments/${establishmentId}/field-workers`,
    );
    await this.row(email).getByTitle("Más acciones", { exact: true }).click();
    const confirmation = this.page
      .waitForEvent("dialog")
      .then(async (dialog) => {
        expect(dialog.type()).toBe("confirm");
        await dialog.accept();
      });
    const saved = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === REVOKE_ESTABLISHMENTS_ENDPOINT(id) &&
        r.request().method() === "PATCH",
    );
    await this.page
      .getByRole("menuitem", { name: "Quitar acceso", exact: true })
      .click();
    await confirmation;
    expect((await saved).status()).toBe(204);
    await expect(
      this.page.getByText(ESTABLISHMENT_DASHBOARD_PAGE.noFieldWorkers, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(this.row(email)).toHaveCount(0);
  }
}
