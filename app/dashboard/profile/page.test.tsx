import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "./page";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import {
  ESTABLISHMENTS_ENDPOINT,
  ME_ESTABLISHMENTS_ENDPOINT,
  ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT,
  ME_ESTABLISHMENTS_WITHDRAW_ENDPOINT,
} from "@/constants/api";
import {
  makeMeHandler,
  makeMyEstablishmentsHandler,
  makeRequestEstablishmentAccessHandler,
  makeSubscribeEstablishmentsHandler,
  makeUnsubscribeEstablishmentsHandler,
  makeWithdrawEstablishmentAccessHandler,
} from "@/mocks/handlers/user";
import { MY_ESTABLISHMENTS, PROFILE_PAGE } from "@/constants/users";
import { ProfileEstablishment, ProfileResponse } from "@/types/user";

describe("ProfilePage", () => {
  const sampleEstablishments: ProfileEstablishment[] = [
    {
      id: "est-1",
      name: "Comedor Los Bajitos",
      formatted_address: "Calle Falsa 123, Rosario",
      status: "approved",
    },
    {
      id: "est-2",
      name: "Merendero Sol Naciente",
      formatted_address: "Av. Siempre Viva 742, Rosario",
      status: "pending",
    },
    {
      id: "est-3",
      name: "Comedor La Esperanza",
      formatted_address: "Pasaje 1, Rosario",
      status: "rejected",
    },
    {
      id: "est-4",
      name: "Comedor Rincón Feliz",
      formatted_address: "Ruta 9, Rosario",
      status: "withdrawn",
    },
  ];

  const baseProfile: ProfileResponse = {
    id: "user-1",
    email: "analyst@example.com",
    name: "Ana",
    last_name: "García",
    role: "analyst",
    locality: "Rosario",
    contact_phone: "+54 9 341 555-1234",
    description: "Analista de datos nutricionales",
    establishments: sampleEstablishments,
  };

  beforeEach(() => {
    server.use(
      makeMeHandler({ data: baseProfile }),
      makeMyEstablishmentsHandler({ data: sampleEstablishments }),
      makeRequestEstablishmentAccessHandler(),
      makeWithdrawEstablishmentAccessHandler(),
      makeSubscribeEstablishmentsHandler(),
      makeUnsubscribeEstablishmentsHandler(),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders extended profile fields correctly", async () => {
    await renderWithProviders(<ProfilePage />);

    expect(
      screen.getByRole("heading", { name: PROFILE_PAGE.title }),
    ).toBeInTheDocument();

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("García")).toBeInTheDocument();
    expect(screen.getByText("analyst@example.com")).toBeInTheDocument();
    expect(screen.getByText("Analista")).toBeInTheDocument();
    expect(screen.getByText("Rosario")).toBeInTheDocument();
    expect(screen.getByText("+54 9 341 555-1234")).toBeInTheDocument();
    expect(
      screen.getByText("Analista de datos nutricionales"),
    ).toBeInTheDocument();
  });

  it("displays '-' for empty optional fields", async () => {
    server.use(
      makeMeHandler({
        data: {
          ...baseProfile,
          locality: null,
          contact_phone: null,
          description: null,
        },
      }),
    );

    await renderWithProviders(<ProfilePage />);

    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("renders linked establishments with status badges", async () => {
    await renderWithProviders(<ProfilePage />);

    expect(screen.getByText("Comedor Los Bajitos")).toBeInTheDocument();
    expect(screen.getByText("Calle Falsa 123, Rosario")).toBeInTheDocument();
    expect(screen.getByText("Aprobado")).toBeInTheDocument();

    expect(screen.getByText("Merendero Sol Naciente")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();

    expect(screen.getByText("Comedor La Esperanza")).toBeInTheDocument();
    expect(screen.getByText("Rechazado")).toBeInTheDocument();

    expect(screen.getByText("Comedor Rincón Feliz")).toBeInTheDocument();
    expect(screen.getByText("Retirado")).toBeInTheDocument();
  });

  describe("Analyst role (can request and withdraw access)", () => {
    it("renders request access button and withdraw button on pending/approved establishments", async () => {
      await renderWithProviders(<ProfilePage />);

      // Request access button at section level
      const requestBtns = screen.getAllByRole("button", {
        name: /Solicitar acceso/i,
      });
      expect(requestBtns.length).toBeGreaterThanOrEqual(1);

      // Does NOT render admin subscribe button
      expect(
        screen.queryByRole("button", { name: /^Suscribirme$/i }),
      ).not.toBeInTheDocument();

      // Withdraw buttons exist on approved/pending rows
      const withdrawBtns = screen.getAllByRole("button", {
        name: MY_ESTABLISHMENTS.actions.withdraw,
      });
      expect(withdrawBtns.length).toBe(2); // for est-1 (approved) and est-2 (pending)
    });

    it("searches catalog and requests establishment access", async () => {
      const user = userEvent.setup();
      let requestedIds: string[] = [];

      server.use(
        http.get(ESTABLISHMENTS_ENDPOINT, () => {
          return HttpResponse.json({
            items: [
              {
                id: "est-search-1",
                name: "Comedor Buscado 1",
                formatted_address: "Dirección 1",
                city: "Rosario",
                province: "Santa Fe",
                characterization_status: "complete",
              },
            ],
            total: 1,
            page: 1,
          });
        }),
        http.post(ME_ESTABLISHMENTS_ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            establishment_ids: string[];
          };
          requestedIds = body.establishment_ids;
          return HttpResponse.json([
            ...sampleEstablishments,
            {
              id: "est-search-1",
              name: "Comedor Buscado 1",
              formatted_address: "Dirección 1",
              status: "pending",
            },
          ]);
        }),
      );

      await renderWithProviders(<ProfilePage />);

      // Open search modal
      const openSearchBtn = screen.getByRole("button", {
        name: /Solicitar acceso/i,
      });
      await user.click(openSearchBtn);

      expect(
        screen.getByRole("heading", {
          name: MY_ESTABLISHMENTS.dialogs.searchTitleRequest,
        }),
      ).toBeInTheDocument();

      // Type and search
      const searchInput = screen.getByPlaceholderText(
        MY_ESTABLISHMENTS.dialogs.searchPlaceholder,
      );
      await user.type(searchInput, "Buscado");

      const submitSearchBtn = screen.getByRole("button", {
        name: MY_ESTABLISHMENTS.dialogs.searchButton,
      });
      await user.click(submitSearchBtn);

      // Verify search result
      expect(await screen.findByText("Comedor Buscado 1")).toBeInTheDocument();

      // Click request button inside modal
      const requestInModalBtn = screen.getByRole("button", {
        name: MY_ESTABLISHMENTS.actions.requestAccess,
      });
      await user.click(requestInModalBtn);

      await waitFor(() => {
        expect(requestedIds).toEqual(["est-search-1"]);
      });
    });

    it("renders link to propose establishment when not found", async () => {
      const user = userEvent.setup();

      server.use(
        http.get(ESTABLISHMENTS_ENDPOINT, () => {
          return HttpResponse.json({ items: [], total: 0, page: 1 });
        }),
      );

      await renderWithProviders(<ProfilePage />);

      const openSearchBtn = screen.getByRole("button", {
        name: /Solicitar acceso/i,
      });
      await user.click(openSearchBtn);

      const submitSearchBtn = screen.getByRole("button", {
        name: MY_ESTABLISHMENTS.dialogs.searchButton,
      });
      await user.click(submitSearchBtn);

      expect(
        await screen.findByText(MY_ESTABLISHMENTS.dialogs.noResults),
      ).toBeInTheDocument();

      const proposeLinks = screen.getAllByRole("link", {
        name: /Proponé uno nuevo/i,
      });
      expect(proposeLinks.length).toBeGreaterThanOrEqual(1);
      expect(proposeLinks[0]).toHaveAttribute(
        "href",
        "/dashboard/establishments/propose",
      );
    });

    it("confirms and withdraws establishment access", async () => {
      const user = userEvent.setup();
      let withdrawnIds: string[] = [];

      server.use(
        http.patch(ME_ESTABLISHMENTS_WITHDRAW_ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            establishment_ids: string[];
          };
          withdrawnIds = body.establishment_ids;
          return HttpResponse.json([
            {
              id: "est-1",
              name: "Comedor Los Bajitos",
              formatted_address: "Calle Falsa 123, Rosario",
              status: "withdrawn",
            },
          ]);
        }),
      );

      await renderWithProviders(<ProfilePage />);

      const withdrawBtns = screen.getAllByRole("button", {
        name: MY_ESTABLISHMENTS.actions.withdraw,
      });
      await user.click(withdrawBtns[0]); // Click withdraw for "Comedor Los Bajitos"

      // Confirmation dialog should be visible
      expect(
        screen.getByRole("heading", {
          name: MY_ESTABLISHMENTS.dialogs.withdrawTitle,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          new RegExp(
            `¿Confirmás que deseás retirar tu solicitud de acceso a Comedor Los Bajitos`,
            "i",
          ),
        ),
      ).toBeInTheDocument();

      // Confirm withdrawal
      const confirmBtn = screen.getByRole("button", {
        name: MY_ESTABLISHMENTS.actions.confirmWithdraw,
      });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(withdrawnIds).toEqual(["est-1"]);
      });
    });
  });

  describe("Admin role (can subscribe and unsubscribe)", () => {
    it("renders subscribe button and unsubscribe button, denying analyst actions", async () => {
      server.use(
        makeMeHandler({
          data: {
            ...baseProfile,
            role: "admin",
          },
        }),
      );

      await renderWithProviders(<ProfilePage />);

      await screen.findByText("Comedor Los Bajitos");

      expect(
        screen.getByRole("button", { name: /^Suscribirme$/i }),
      ).toBeInTheDocument();

      // Analyst request button is NOT visible
      expect(
        screen.queryByRole("button", { name: /^Solicitar acceso$/i }),
      ).not.toBeInTheDocument();

      // Analyst withdraw button is NOT visible
      expect(
        screen.queryByRole("button", {
          name: MY_ESTABLISHMENTS.actions.withdraw,
        }),
      ).not.toBeInTheDocument();

      // Admin unsubscribe buttons are visible
      const unsubscribeBtns = screen.getAllByRole("button", {
        name: MY_ESTABLISHMENTS.actions.unsubscribe,
      });
      expect(unsubscribeBtns.length).toBe(sampleEstablishments.length);
    });

    it("confirms and unsubscribes from establishment using query parameter", async () => {
      const user = userEvent.setup();
      let queryEstablishmentIds: string[] = [];

      server.use(
        makeMeHandler({
          data: {
            ...baseProfile,
            role: "admin",
          },
        }),
        http.delete(ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT, ({ request }) => {
          const url = new URL(request.url);
          queryEstablishmentIds = url.searchParams.getAll("establishment_ids");
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await renderWithProviders(<ProfilePage />);

      await screen.findByText("Comedor Los Bajitos");

      const unsubscribeBtns = screen.getAllByRole("button", {
        name: MY_ESTABLISHMENTS.actions.unsubscribe,
      });
      await user.click(unsubscribeBtns[0]); // Click unsubscribe for first establishment

      // Confirmation dialog should be visible
      expect(
        screen.getByRole("heading", {
          name: MY_ESTABLISHMENTS.dialogs.unsubscribeTitle,
        }),
      ).toBeInTheDocument();

      // Confirm unsubscription
      const confirmBtn = screen.getByRole("button", {
        name: MY_ESTABLISHMENTS.actions.confirmUnsubscribe,
      });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(queryEstablishmentIds).toEqual(["est-1"]);
      });
    });
  });

  describe("Field worker role (no management capabilities)", () => {
    it("renders establishments list without any management buttons", async () => {
      server.use(
        makeMeHandler({
          data: {
            ...baseProfile,
            role: "field_worker",
          },
        }),
      );

      await renderWithProviders(<ProfilePage />);

      expect(
        await screen.findByText("Comedor Los Bajitos"),
      ).toBeInTheDocument();

      expect(
        screen.queryByRole("button", { name: /Solicitar acceso/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Suscribirme$/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: MY_ESTABLISHMENTS.actions.withdraw,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: MY_ESTABLISHMENTS.actions.unsubscribe,
        }),
      ).not.toBeInTheDocument();
    });
  });
});
