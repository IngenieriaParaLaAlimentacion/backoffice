import type { Request } from "@playwright/test";
import { test, expect } from "../flow-fixtures";
import { StockPage } from "../pages/stock.page";
import {
  ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT,
  ESTABLISHMENT_STOCK_ENDPOINT,
  FOOD_OUTFLOWS_ENDPOINT,
} from "../../constants/api";
import {
  FOOD_MOVEMENT_FORM as FORM,
  FOOD_INTAKE_ORIGIN_LABELS,
  FOOD_INTAKE_RECURRENCE_LABELS,
  FOOD_OUTFLOW_CATEGORY_LABELS,
} from "../../constants/establishments";
import { OUTFLOW_EXCEEDS_STOCK } from "../../schemas/foodMovement.schema";
import { availableMillis } from "../../lib/foodMovementQuantity";
import type {
  PaginatedFoodMovementsResponse,
  PaginatedFoodStockResponse,
} from "../../types/establishment";

test.describe("stock", () => {
  test.use({ role: "admin" });

  test("intake and outflow persist; excess is rejected without a movement", async ({
    page,
    api,
    flow,
  }) => {
    const establishment = await flow.establishment("stock");
    const food = await flow.food();
    const quantities =
      food.base_unit === "unidades"
        ? { intake: "12", outflow: "2", balance: "10", excess: "11" }
        : {
            intake: "12.500",
            outflow: "2.250",
            balance: "10.250",
            excess: "10.251",
          };
    const intakeComment = flow.name("intake", 100);
    const outflowComment = flow.name("outflow", 100);
    const stock = new StockPage(page);
    await stock.goto(establishment.id);
    await stock.draft("in", food, quantities.intake, intakeComment);
    const intake = await stock.save(establishment.id, "in", food.id);
    expect(availableMillis(intake.items[0].quantity)).toBe(
      availableMillis(quantities.intake),
    );
    await stock.expectBalance(food, quantities.intake);
    await stock.goto(establishment.id);
    await stock.expectBalance(food, quantities.intake);

    await stock.draft("out", food, quantities.outflow, outflowComment);
    const outflow = await stock.save(establishment.id, "out", food.id);
    expect(outflow.id).not.toBe(intake.id);
    expect(availableMillis(outflow.items[0].quantity)).toBe(
      availableMillis(quantities.outflow),
    );
    await stock.expectBalance(food, quantities.balance);
    const savedDetail = await stock.savedDetail(establishment.id, outflow.id);
    expect(savedDetail).toMatchObject({
      id: outflow.id,
      direction: "out",
      comments: outflowComment,
      category: "kitchen",
    });
    await stock.expectDetail(food, quantities.outflow, outflowComment);
    await expect(page.getByRole("dialog")).toContainText(
      FOOD_OUTFLOW_CATEGORY_LABELS.kitchen,
    );

    await stock.goto(establishment.id);
    await stock.expectBalance(food, quantities.balance);
    const history = await stock.history(establishment.id);
    expect(history.total).toBe(2);
    expect(history.items.map((movement) => movement.id).sort()).toEqual(
      [intake.id, outflow.id].sort(),
    );
    await expect(page.locator("table:visible tbody tr")).toHaveCount(2);
    const intakeDetail = await stock.historyDetail(
      establishment.id,
      intake.id,
      "in",
    );
    expect(intakeDetail).toMatchObject({
      id: intake.id,
      direction: "in",
      source: "manual",
      origin_type: "private_donation",
      is_recurring: false,
      comments: intakeComment,
    });
    await stock.expectDetail(food, quantities.intake, intakeComment);
    await expect(page.getByRole("dialog")).toContainText(
      FOOD_INTAKE_ORIGIN_LABELS.private_donation,
    );
    await expect(page.getByRole("dialog")).toContainText(
      FOOD_INTAKE_RECURRENCE_LABELS.false,
    );

    await stock.goto(establishment.id);
    await stock.draft(
      "out",
      food,
      quantities.excess,
      flow.name("rejected", 100),
    );
    const posts: Request[] = [];
    const observe = (request: Request) => {
      if (
        request.method() === "POST" &&
        new URL(request.url()).pathname === FOOD_OUTFLOWS_ENDPOINT
      )
        posts.push(request);
    };
    page.on("request", observe);
    try {
      await stock.dialog
        .getByRole("button", { name: FORM.save, exact: true })
        .click();
      await expect(stock.dialog.getByRole("alert")).toHaveCount(1);
      await expect(stock.dialog.getByRole("alert")).toHaveText(
        OUTFLOW_EXCEEDS_STOCK,
      );
      await expect(stock.dialog).toBeVisible();
      expect(posts).toHaveLength(0);
      await stock.dialog
        .getByRole("button", { name: FORM.cancel, exact: true })
        .click();
      await expect(stock.dialog).toBeHidden();
      await stock.goto(establishment.id);
      await stock.expectBalance(food, quantities.balance);
      const balanceResponse = await api.request(
        "GET",
        `${ESTABLISHMENT_STOCK_ENDPOINT(establishment.id)}?only_available=true`,
      );
      expect(balanceResponse.status()).toBe(200);
      const balance =
        (await balanceResponse.json()) as PaginatedFoodStockResponse;
      expect(balance.total).toBe(1);
      expect(balance.items[0].food.id).toBe(food.id);
      expect(availableMillis(balance.items[0].quantity)).toBe(
        availableMillis(quantities.balance),
      );
      const historyResponse = await api.request(
        "GET",
        ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT(establishment.id),
      );
      expect(historyResponse.status()).toBe(200);
      const finalHistory =
        (await historyResponse.json()) as PaginatedFoodMovementsResponse;
      expect(finalHistory.total).toBe(2);
      expect(finalHistory.items.map((movement) => movement.id).sort()).toEqual(
        [intake.id, outflow.id].sort(),
      );
      expect(posts).toHaveLength(0);
    } finally {
      page.off("request", observe);
    }
  });
});
