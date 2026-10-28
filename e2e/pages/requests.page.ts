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
import {
  ESTABLISHMENT_DASHBOARD_PAGE,
  ESTABLISHMENT_REQUESTS_PAGE,
  ESTABLISHMENT_REQUEST_REVIEW_PANEL as REVIEW_PANEL,
} from "../../constants/establishments";
import {
  ESTABLISHMENT_ACCESS_REQUESTS_PAGE,
  PENDING_REQUESTS_PAGE,
} from "../../constants/users";
import { EstablishmentsPage } from "./establishments.page";
import { waitForApi, matchesApiRequest } from "../support/api";

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
      .getByRole("button", {
        name: ESTABLISHMENT_REQUESTS_PAGE.reviewButton,
        exact: true,
      })
      .click();
    return this.page.getByRole("dialog");
  }

  async approveCreation(
    id: string,
    name: string,
    address: string,
  ): Promise<EstablishmentApprovalResponse> {
    const dialog = await this.creation(name);
    await new EstablishmentsPage(this.page).pickAddress(address, dialog);
    await dialog
      .getByRole("button", { name: REVIEW_PANEL.approveLabel, exact: true })
      .click();
    const saved = waitForApi(
      this.page,
      "PATCH",
      APPROVE_ESTABLISHMENT_REQUEST_ENDPOINT(id),
    );
    await dialog
      .getByRole("button", {
        name: REVIEW_PANEL.approveConfirmLabel,
        exact: true,
      })
      .click();
    const response = await saved;
    expect(response.status()).toBe(200);
    await expect(dialog).toBeHidden();
    await expect(this.row(name)).toHaveCount(0);
    return (await response.json()) as EstablishmentApprovalResponse;
  }

  async rejectCreation(id: string, name: string) {
    const dialog = await this.creation(name);
    await dialog
      .getByRole("button", { name: REVIEW_PANEL.rejectLabel, exact: true })
      .click();
    await dialog
      .getByPlaceholder(REVIEW_PANEL.rejectReasonPlaceholder, {
        exact: true,
      })
      .fill("E2E fictional request rejected");
    const saved = waitForApi(
      this.page,
      "PATCH",
      REJECT_ESTABLISHMENT_REQUEST_ENDPOINT(id),
    );
    await dialog
      .getByRole("button", {
        name: REVIEW_PANEL.rejectConfirmLabel,
        exact: true,
      })
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
          matchesApiRequest(r.request(), "GET", LIST_USERS_ENDPOINT) &&
          url.searchParams.get("status") === "pending_validation" &&
          url.searchParams.get("role") === "field_worker" &&
          // The tab badges request page_size=1 from the same endpoint.
          url.searchParams.get("page_size") === "20" &&
          url.searchParams.get("page") === String(pageNumber)
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
      .getByRole("button", { name: PENDING_REQUESTS_PAGE.review, exact: true })
      .click();
    const dialog = this.page.getByRole("dialog");
    await expect(dialog.getByText(email, { exact: true })).toBeVisible();
    // Leave every establishment undecided: this transition activates only the account.
    await dialog
      .getByRole("button", {
        name: PENDING_REQUESTS_PAGE.acceptRequest,
        exact: true,
      })
      .click();
    const saved = waitForApi(
      this.page,
      "PATCH",
      APPROVE_FIELD_WORKER_ENDPOINT(id),
    );
    await dialog
      .getByRole("button", {
        name: PENDING_REQUESTS_PAGE.acceptConfirm,
        exact: true,
      })
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
      .getByRole("button", {
        name: ESTABLISHMENT_ACCESS_REQUESTS_PAGE.reviewButton,
        exact: true,
      })
      .click();
    const dialog = this.page.getByRole("dialog");
    const card = dialog.getByRole("group", {
      name: establishment,
      exact: true,
    });
    await card
      .getByRole("button", { name: PENDING_REQUESTS_PAGE.accept, exact: true })
      .click();
    await dialog
      .getByRole("button", {
        name: ESTABLISHMENT_ACCESS_REQUESTS_PAGE.apply,
        exact: true,
      })
      .click();
    const saved = waitForApi(
      this.page,
      "PATCH",
      APPROVE_ESTABLISHMENTS_ENDPOINT(id),
    );
    await dialog
      .getByRole("button", {
        name: ESTABLISHMENT_ACCESS_REQUESTS_PAGE.applyConfirm,
        exact: true,
      })
      .click();
    expect((await saved).status()).toBe(204);
    await expect(dialog).toBeHidden();
  }

  async revoke(id: string, email: string, establishmentId: string) {
    await this.page.goto(
      `/dashboard/establishments/${establishmentId}/field-workers`,
    );
    await this.row(email)
      .getByTitle(ESTABLISHMENT_DASHBOARD_PAGE.actionsMenuLabel, {
        exact: true,
      })
      .click();
    const confirmation = this.page
      .waitForEvent("dialog")
      .then(async (dialog) => {
        expect(dialog.type()).toBe("confirm");
        await dialog.accept();
      });
    const saved = waitForApi(
      this.page,
      "PATCH",
      REVOKE_ESTABLISHMENTS_ENDPOINT(id),
    );
    await this.page
      .getByRole("menuitem", {
        name: ESTABLISHMENT_DASHBOARD_PAGE.removeAccess,
        exact: true,
      })
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
