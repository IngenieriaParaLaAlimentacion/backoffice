import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import FoodMovementDialog from "./FoodMovementDialog";
import { Button } from "@/components/ui/button";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  MOCK_ESTABLISHMENTS,
  setMovementStock,
} from "@/mocks/fixtures/establishment";
import { MOCK_FOODS } from "@/mocks/fixtures/foodCatalog";
import { FOOD_INTAKES_ENDPOINT, FOOD_OUTFLOWS_ENDPOINT } from "@/constants/api";
import {
  CreateFoodMovementRequest,
  FoodStockItem,
} from "@/types/establishment";

const establishmentId = MOCK_ESTABLISHMENTS[0].id;
const openDialog = async (onSaved = vi.fn()) => {
  await renderWithProviders(
    <FoodMovementDialog
      establishmentId={establishmentId}
      open
      onOpenChange={vi.fn()}
      onSaved={onSaved}
    />,
  );
  return onSaved;
};

describe("FoodMovementDialog", () => {
  it("accepts comma decimals and sends dot decimals to the API", async () => {
    const user = userEvent.setup();
    let submitted: CreateFoodMovementRequest | null = null;
    server.use(
      http.post(FOOD_INTAKES_ENDPOINT, async ({ request }) => {
        submitted = (await request.json()) as CreateFoodMovementRequest;
        return HttpResponse.json(
          {
            ...submitted,
            responsible_id: "f1000000-0000-0000-0000-000000000001",
            created_at: new Date().toISOString(),
            items: [],
          },
          { status: 201 },
        );
      }),
    );
    const onSaved = await openDialog();
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    await user.click(await screen.findByRole("option", { name: /Arroz/ }));
    expect(
      screen.getByText("Podés usar coma o punto para los decimales."),
    ).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Cantidad 1" }), "0,5");
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect((submitted as CreateFoodMovementRequest | null)?.items).toEqual([
      { food_id: MOCK_FOODS[0].id, quantity: "0.5" },
    ]);
  });

  it("shows a Spanish validation message for an empty date", async () => {
    const user = userEvent.setup();
    await openDialog();
    await user.clear(screen.getByLabelText("Fecha"));
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    expect(await screen.findByRole("alert", { name: "" })).toHaveTextContent(
      "Ingresá una fecha válida",
    );
  });

  it("supports keyboard food selection and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Abrir</Button>
          <FoodMovementDialog
            establishmentId={establishmentId}
            open={open}
            onOpenChange={setOpen}
            onSaved={vi.fn()}
          />
        </>
      );
    }
    await renderWithProviders(<Harness />);
    const trigger = screen.getByRole("button", { name: "Abrir" });
    await user.click(trigger);
    const picker = screen.getByRole("combobox", { name: "Alimento" });
    await user.click(picker);
    await screen.findByRole("option", { name: /Arroz/ });
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");
    expect(picker).toHaveValue("Arroz");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps an empty-stock outflow unavailable", async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <FoodMovementDialog
        establishmentId={MOCK_ESTABLISHMENTS[1].id}
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    await user.click(screen.getByLabelText("Egreso"));
    expect(
      await screen.findByText(
        "No hay stock disponible para registrar un egreso.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    ).toBeDisabled();
  });

  it("shows a catalog failure and prevents submitting", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/v1/food-catalog/foods", () =>
        HttpResponse.json(
          {
            type: "/errors/catalog-unavailable",
            title: "Error",
            status: 500,
            detail: "Failed",
          },
          { status: 500 },
        ),
      ),
    );
    await openDialog();
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    expect(
      (
        await screen.findAllByText(
          "No se pudo cargar el catálogo de alimentos.",
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    ).toBeDisabled();
  });

  it("uses the current instant for an Argentine today entry", async () => {
    vi.setSystemTime(new Date("2026-09-30T01:00:00Z"));
    const user = userEvent.setup();
    let submitted: CreateFoodMovementRequest | null = null;
    server.use(
      http.post(FOOD_INTAKES_ENDPOINT, async ({ request }) => {
        submitted = (await request.json()) as CreateFoodMovementRequest;
        return HttpResponse.json(
          {
            ...submitted,
            responsible_id: "f1000000-0000-0000-0000-000000000001",
            created_at: new Date().toISOString(),
            items: [],
          },
          { status: 201 },
        );
      }),
    );
    try {
      const onSaved = await openDialog();
      expect(screen.getByLabelText("Fecha")).toHaveValue("2026-09-29");
      await user.click(screen.getByRole("combobox", { name: "Alimento" }));
      await user.click(await screen.findByRole("option", { name: /Arroz/ }));
      await user.type(screen.getByRole("textbox", { name: "Cantidad 1" }), "1");
      await user.click(
        screen.getByRole("button", { name: "Guardar movimiento" }),
      );
      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect((submitted as CreateFoodMovementRequest | null)?.occurred_at).toBe(
        "2026-09-30T01:00:00.000Z",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("loads beyond 100 stock choices and resolves a 409 with the later-page balance", async () => {
    const user = userEvent.setup();
    const food = MOCK_FOODS[0];
    const stock: FoodStockItem[] = Array.from({ length: 100 }, (_, index) => ({
      food: {
        id: `d2000000-0000-0000-0000-${String(index).padStart(12, "0")}`,
        name: `A${String(index).padStart(3, "0")}`,
      },
      category: food.category,
      unit: food.base_unit,
      quantity: "5",
      updated_at: "2026-09-01T00:00:00Z",
    }));
    stock.push({
      food: { id: food.id, name: food.name },
      category: food.category,
      unit: food.base_unit,
      quantity: "5",
      updated_at: "2026-09-01T00:00:00Z",
    });
    setMovementStock(establishmentId, stock);
    let posts = 0;
    server.use(
      http.post(FOOD_OUTFLOWS_ENDPOINT, async ({ request }) => {
        posts += 1;
        const body = (await request.json()) as CreateFoodMovementRequest;
        setMovementStock(
          establishmentId,
          stock.map((row) =>
            row.food.id === food.id ? { ...row, quantity: "1" } : row,
          ),
        );
        return HttpResponse.json(
          {
            type: "/errors/insufficient-stock",
            title: "Insufficient stock",
            status: 409,
            detail: "Insufficient stock",
            instance: new URL(request.url).pathname,
            food_id: food.id,
            requested: body.items[0].quantity,
            available: "1",
          },
          { status: 409 },
        );
      }),
    );
    await openDialog();
    await user.click(screen.getByLabelText("Egreso"));
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    await user.click(
      await screen.findByRole("button", { name: "Cargar más alimentos" }),
    );
    await user.click(await screen.findByRole("option", { name: /Arroz/ }));
    await user.type(screen.getByRole("textbox", { name: "Cantidad 1" }), "2");
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    expect(
      await screen.findByText(/Stock insuficiente para Arroz/),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/^1 kilogramos$/)).toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    expect(
      await screen.findByText("La cantidad supera el stock disponible"),
    ).toBeInTheDocument();
    expect(posts).toBe(1);
  });

  it("shows a line error when a 409 refresh finds the selected food depleted", async () => {
    const user = userEvent.setup();
    const food = MOCK_FOODS[0];
    const stock: FoodStockItem[] = [
      {
        food: { id: food.id, name: food.name },
        category: food.category,
        unit: food.base_unit,
        quantity: "5",
        updated_at: "2026-09-01T00:00:00Z",
      },
    ];
    setMovementStock(establishmentId, stock);
    let posts = 0;
    server.use(
      http.post(FOOD_OUTFLOWS_ENDPOINT, async ({ request }) => {
        posts += 1;
        setMovementStock(establishmentId, []);
        return HttpResponse.json(
          {
            type: "/errors/insufficient-stock",
            title: "Insufficient stock",
            status: 409,
            detail: "Insufficient stock",
            instance: new URL(request.url).pathname,
            food_id: food.id,
            requested: "2",
            available: "0",
          },
          { status: 409 },
        );
      }),
    );
    await openDialog();
    await user.click(screen.getByLabelText("Egreso"));
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    await user.click(await screen.findByRole("option", { name: /Arroz/ }));
    await user.type(screen.getByRole("textbox", { name: "Cantidad 1" }), "2");
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    expect(
      await screen.findByText(/Stock insuficiente para Arroz/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("La cantidad supera el stock disponible"),
    ).toBeInTheDocument();
    expect(screen.getByText(/^0 kilogramos$/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    ).toBeDisabled();
    expect(posts).toBe(1);
  });

  it("retries an ambiguous intake with the identical request and reports a stored replay", async () => {
    const user = userEvent.setup();
    const bodies: CreateFoodMovementRequest[] = [];
    server.use(
      http.post(FOOD_INTAKES_ENDPOINT, async ({ request }) => {
        const body = (await request.json()) as CreateFoodMovementRequest;
        bodies.push(body);
        if (bodies.length === 1) return HttpResponse.error();
        return HttpResponse.json(
          {
            ...body,
            responsible_id: "f1000000-0000-0000-0000-000000000001",
            created_at: new Date().toISOString(),
            items: [],
          },
          { status: 200 },
        );
      }),
    );
    const onSaved = await openDialog();
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    await user.click(await screen.findByRole("option", { name: /Arroz/ }));
    await user.type(
      screen.getByRole("textbox", { name: "Cantidad 1" }),
      "1.125",
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Comprobar y reintentar" }),
    );
    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({ replayed: true }),
      ),
    );
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toEqual(bodies[1]);
    expect(bodies[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(bodies[0].items).toEqual([
      { food_id: MOCK_FOODS[0].id, quantity: "1.125" },
    ]);
  });

  it("keeps the request frozen when a gateway error hides the outcome", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(
        FOOD_INTAKES_ENDPOINT,
        () => new HttpResponse("Bad gateway", { status: 502 }),
      ),
    );
    await openDialog();
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    await user.click(await screen.findByRole("option", { name: /Arroz/ }));
    await user.type(screen.getByRole("textbox", { name: "Cantidad 1" }), "1");
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    expect(
      await screen.findByRole("button", { name: "Comprobar y reintentar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Cantidad 1" })).toBeDisabled();
  });

  it("reports a stock conflict answered to an identical retry", async () => {
    const user = userEvent.setup();
    const food = MOCK_FOODS[0];
    setMovementStock(establishmentId, [
      {
        food: { id: food.id, name: food.name },
        category: food.category,
        unit: food.base_unit,
        quantity: "5",
        updated_at: "2026-09-01T00:00:00Z",
      },
    ]);
    let posts = 0;
    server.use(
      http.post(FOOD_OUTFLOWS_ENDPOINT, async ({ request }) => {
        posts += 1;
        if (posts === 1) return HttpResponse.error();
        return HttpResponse.json(
          {
            type: "/errors/insufficient-stock",
            title: "Insufficient stock",
            status: 409,
            detail: "Insufficient stock",
            instance: new URL(request.url).pathname,
            food_id: food.id,
            requested: "2",
            available: "1",
          },
          { status: 409 },
        );
      }),
    );
    await openDialog();
    await user.click(screen.getByLabelText("Egreso"));
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    await user.click(await screen.findByRole("option", { name: /Arroz/ }));
    await user.type(screen.getByRole("textbox", { name: "Cantidad 1" }), "2");
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Comprobar y reintentar" }),
    );
    expect(
      await screen.findByText(/Stock insuficiente para Arroz/),
    ).toBeInTheDocument();
  });

  it("closes only the food list on Escape and keeps the draft", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    await renderWithProviders(
      <FoodMovementDialog
        establishmentId={establishmentId}
        open
        onOpenChange={onOpenChange}
        onSaved={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    await screen.findByRole("option", { name: /Arroz/ });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("option", { name: /Arroz/ })).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not pick a stale option while a new search is loading", async () => {
    const user = userEvent.setup();
    await openDialog();
    const picker = screen.getByRole("combobox", { name: "Alimento" });
    await user.click(picker);
    await screen.findByRole("option", { name: /Arroz/ });
    await user.type(picker, "zzz{Enter}");
    expect(picker).toHaveValue("zzz");
  });
});
