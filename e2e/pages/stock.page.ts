import type { Page } from "@playwright/test";
import { expect } from "../flow-fixtures";
import {
  ESTABLISHMENT_FOOD_MOVEMENT_DETAIL_ENDPOINT,
  ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT,
  ESTABLISHMENT_STOCK_ENDPOINT,
  FOOD_INTAKES_ENDPOINT,
  FOOD_OUTFLOWS_ENDPOINT,
} from "../../constants/api";
import {
  ESTABLISHMENT_MOVEMENTS_PAGE as HISTORY,
  ESTABLISHMENT_STOCK_PAGE as STOCK,
  FOOD_MOVEMENT_FORM as FORM,
  MOVEMENT_DIRECTION_LABELS,
  STOCK_UNIT_LABELS,
} from "../../constants/establishments";
import { argentineToday, formatQuantity } from "../../lib/format";
import type {
  CreatedFoodMovement,
  FoodMovementDetail,
  FoodMovementDirection,
  PaginatedFoodMovementsResponse,
} from "../../types/establishment";

import type { FoodListItem } from "../../types/foodCatalog";

type CatalogFood = Pick<FoodListItem, "id" | "name" | "base_unit">;

export class StockPage {
  constructor(private readonly page: Page) {}

  get dialog() {
    return this.page.getByRole("dialog", { name: FORM.title, exact: true });
  }

  async goto(establishmentId: string) {
    const read = this.page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        new URL(response.url()).pathname ===
          ESTABLISHMENT_STOCK_ENDPOINT(establishmentId) &&
        new URL(response.url()).searchParams.get("only_available") === "true" &&
        response.status() === 200,
    );
    await this.page.goto(`/dashboard/establishments/${establishmentId}/stock`);
    await read;
    await expect(
      this.page.getByRole("button", {
        name: STOCK.createMovement,
        exact: true,
      }),
    ).toBeVisible();
  }

  async draft(
    direction: FoodMovementDirection,
    food: CatalogFood,
    quantity: string,
    comments: string,
  ) {
    await this.page
      .getByRole("button", { name: STOCK.createMovement, exact: true })
      .click();
    await expect(this.dialog).toBeVisible();
    await this.dialog
      .getByRole("radio", {
        name: MOVEMENT_DIRECTION_LABELS[direction],
        exact: true,
      })
      .check();
    await expect(
      this.dialog.getByLabel(FORM.date, { exact: true }),
    ).toHaveValue(argentineToday());
    await this.dialog
      .getByRole("combobox", { name: FORM.food, exact: true })
      .fill(food.name);
    await this.dialog.locator(`[role="option"][id$="-${food.id}"]`).click();
    await this.dialog
      .getByLabel(`${FORM.quantity} 1`, { exact: true })
      .fill(quantity);
    await this.dialog.getByLabel(FORM.comments, { exact: true }).fill(comments);
    if (direction === "in") {
      await this.dialog
        .getByLabel(FORM.origin, { exact: true })
        .selectOption("private_donation");
      await this.dialog
        .getByLabel(FORM.recurrence, { exact: true })
        .selectOption("false");
    } else {
      await this.dialog
        .getByLabel(FORM.category, { exact: true })
        .selectOption("kitchen");
    }
    await expect(
      this.dialog.getByRole("button", { name: FORM.save, exact: true }),
    ).toBeEnabled();
  }

  async save(
    establishmentId: string,
    direction: FoodMovementDirection,
    foodId: string,
  ) {
    const endpoint =
      direction === "in" ? FOOD_INTAKES_ENDPOINT : FOOD_OUTFLOWS_ENDPOINT;
    const saved = this.page.waitForResponse((response) => {
      if (
        response.request().method() !== "POST" ||
        new URL(response.url()).pathname !== endpoint
      )
        return false;
      return (
        response.request().postDataJSON().establishment_id === establishmentId
      );
    });
    await this.dialog
      .getByRole("button", { name: FORM.save, exact: true })
      .click();
    const response = await saved;
    expect(response.status()).toBe(201);
    const request = response.request().postDataJSON();
    expect(request).toMatchObject({
      establishment_id: establishmentId,
      source: "manual",
    });
    expect(request.items).toHaveLength(1);
    expect(request.items[0].food_id).toBe(foodId);
    expect(typeof request.items[0].quantity).toBe("string");
    if (direction === "in") {
      expect(request).toMatchObject({
        origin_type: "private_donation",
        is_recurring: false,
      });
    } else {
      expect(request.category).toBe("kitchen");
      expect(request).not.toHaveProperty("origin_type");
      expect(request).not.toHaveProperty("is_recurring");
    }
    const movement = (await response.json()) as CreatedFoodMovement;
    expect(movement.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(movement.id).toBe(request.id);
    await expect(this.dialog).toBeHidden();
    await expect(this.page.getByRole("status")).toContainText(STOCK.saved);
    return movement;
  }

  async expectBalance(food: CatalogFood, quantity: string) {
    const row = this.page.locator("table:visible tbody tr").filter({
      has: this.page.getByRole("cell", { name: food.name, exact: true }),
    });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("cell").nth(2)).toHaveText(
      STOCK_UNIT_LABELS[food.base_unit],
    );
    await expect(row.getByRole("cell").nth(3)).toHaveText(
      formatQuantity(quantity),
    );
  }

  async savedDetail(establishmentId: string, movementId: string) {
    const detail = this.page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        new URL(response.url()).pathname ===
          ESTABLISHMENT_FOOD_MOVEMENT_DETAIL_ENDPOINT(
            establishmentId,
            movementId,
          ) &&
        response.status() === 200,
    );
    await this.page
      .getByRole("link", { name: STOCK.viewSaved, exact: true })
      .click();
    const response = await detail;
    expect(new URL(this.page.url()).searchParams.get("movement_id")).toBe(
      movementId,
    );
    return response.json() as Promise<FoodMovementDetail>;
  }

  async history(establishmentId: string) {
    const listing = this.page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        new URL(response.url()).pathname ===
          ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT(establishmentId) &&
        response.status() === 200,
    );
    await this.page
      .locator(
        `a[href="/dashboard/establishments/${establishmentId}/stock/movements"]`,
      )
      .click();
    const response = await listing;
    await expect(
      this.page.getByRole("heading", { name: HISTORY.title, exact: true }),
    ).toBeVisible();
    return response.json() as Promise<PaginatedFoodMovementsResponse>;
  }

  async historyDetail(
    establishmentId: string,
    movementId: string,
    direction: FoodMovementDirection,
  ) {
    const detail = this.page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        new URL(response.url()).pathname ===
          ESTABLISHMENT_FOOD_MOVEMENT_DETAIL_ENDPOINT(
            establishmentId,
            movementId,
          ) &&
        response.status() === 200,
    );
    await this.page
      .locator("table:visible tbody tr")
      .filter({
        has: this.page.getByRole("cell", {
          name: MOVEMENT_DIRECTION_LABELS[direction],
          exact: true,
        }),
      })
      .click();
    return (await detail).json() as Promise<FoodMovementDetail>;
  }

  async expectDetail(food: CatalogFood, quantity: string, comments: string) {
    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toContainText(comments);
    const row = dialog.getByRole("row").filter({
      has: dialog.getByRole("cell", { name: food.name, exact: true }),
    });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("cell").nth(1)).toHaveText(
      formatQuantity(quantity),
    );
    await expect(row.getByRole("cell").nth(2)).toHaveText(
      STOCK_UNIT_LABELS[food.base_unit],
    );
  }
}
