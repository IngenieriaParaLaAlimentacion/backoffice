import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "./page";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import {
  ESTABLISHMENTS_ENDPOINT,
  ME_ENDPOINT,
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

type IdsBody = { establishment_ids: string[] };

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

    expect(await screen.findByText("Comedor Los Bajitos")).toBeInTheDocument();
    expect(screen.getByText("Calle Falsa 123, Rosario")).toBeInTheDocument();
    expect(screen.getByText("Aprobado")).toBeInTheDocument();

    expect(screen.getByText("Merendero Sol Naciente")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();

    expect(screen.getByText("Comedor La Esperanza")).toBeInTheDocument();
    expect(screen.getByText("Rechazado")).toBeInTheDocument();

    expect(screen.getByText("Comedor Rincón Feliz")).toBeInTheDocument();
    expect(screen.getByText("Retirado")).toBeInTheDocument();
  });

  // Analysts request access and withdraw it; admins subscribe and unsubscribe.
  // Same section, different endpoints and copy.
  describe.each([
    {
      role: "analyst" as const,
      copy: MY_ESTABLISHMENTS.request,
      other: MY_ESTABLISHMENTS.subscribe,
      removable: ["est-1", "est-2"], // only approved/pending can be withdrawn
      addHandler: (onIds: (ids: string[]) => void) =>
        http.post(ME_ESTABLISHMENTS_ENDPOINT, async ({ request }) => {
          onIds(((await request.json()) as IdsBody).establishment_ids);
          return HttpResponse.json([], { status: 201 });
        }),
      removeHandler: (onIds: (ids: string[]) => void, status = 200) =>
        http.patch(ME_ESTABLISHMENTS_WITHDRAW_ENDPOINT, async ({ request }) => {
          onIds(((await request.json()) as IdsBody).establishment_ids);
          return status === 200
            ? HttpResponse.json([])
            : HttpResponse.json({ detail: "boom" }, { status });
        }),
    },
    {
      role: "admin" as const,
      copy: MY_ESTABLISHMENTS.subscribe,
      other: MY_ESTABLISHMENTS.request,
      removable: sampleEstablishments.map((e) => e.id),
      addHandler: (onIds: (ids: string[]) => void) =>
        http.post(
          ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT,
          async ({ request }) => {
            onIds(((await request.json()) as IdsBody).establishment_ids);
            return HttpResponse.json([], { status: 201 });
          },
        ),
      removeHandler: (onIds: (ids: string[]) => void, status = 204) =>
        http.delete(ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT, ({ request }) => {
          onIds(new URL(request.url).searchParams.getAll("establishment_ids"));
          return status === 204
            ? new HttpResponse(null, { status })
            : HttpResponse.json({ detail: "boom" }, { status });
        }),
    },
  ])("$role", ({ role, copy, other, removable, addHandler, removeHandler }) => {
    beforeEach(() => {
      server.use(makeMeHandler({ data: { ...baseProfile, role } }));
    });

    async function renderSection() {
      await renderWithProviders(<ProfilePage />);
      await screen.findByText("Comedor Los Bajitos");
    }

    it("shows only its own add and remove actions", async () => {
      await renderSection();

      expect(
        screen.getByRole("button", { name: copy.add }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: copy.remove })).toHaveLength(
        removable.length,
      );
      expect(
        screen.queryByRole("button", { name: other.add }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: other.remove }),
      ).not.toBeInTheDocument();
    });

    it("searches the catalog, adds the pick and reloads only the list", async () => {
      const user = userEvent.setup();
      let addedIds: string[] = [];
      let meCalls = 0;
      let listCalls = 0;

      let searchParams: URLSearchParams | null = null;
      server.use(
        http.get(ESTABLISHMENTS_ENDPOINT, ({ request }) => {
          searchParams = new URL(request.url).searchParams;
          return HttpResponse.json({
            items: [
              {
                id: "est-search-1",
                name: "Comedor Buscado 1",
                formatted_address: "Dirección 1",
              },
            ],
            total: 1,
            page: 1,
          });
        }),
        addHandler((ids) => (addedIds = ids)),
      );
      server.events.on("request:start", ({ request }) => {
        const path = new URL(request.url).pathname;
        if (request.method !== "GET") return;
        if (path === ME_ENDPOINT) meCalls++;
        if (path === ME_ESTABLISHMENTS_ENDPOINT) listCalls++;
      });

      await renderSection();
      const meCallsBefore = meCalls;
      const listCallsBefore = listCalls;

      await user.click(screen.getByRole("button", { name: copy.add }));
      expect(
        screen.getByRole("heading", { name: copy.searchTitle }),
      ).toBeInTheDocument();

      await user.type(
        screen.getByPlaceholderText(MY_ESTABLISHMENTS.search.placeholder),
        "Buscado",
      );
      await user.click(
        screen.getByRole("button", { name: MY_ESTABLISHMENTS.search.button }),
      );
      await screen.findByText("Comedor Buscado 1");
      // Only establishments the user isn't already linked to.
      expect(searchParams!.get("available")).toBe("true");
      expect(searchParams!.get("search")).toBe("Buscado");
      await user.click(screen.getByRole("button", { name: copy.add }));

      await waitFor(() => expect(addedIds).toEqual(["est-search-1"]));
      await waitFor(() => expect(listCalls).toBe(listCallsBefore + 1));
      expect(
        screen.queryByRole("heading", { name: copy.searchTitle }),
      ).not.toBeInTheDocument();
      // Regression: refetching the session here used to unmount the dashboard.
      expect(meCalls).toBe(meCallsBefore);
      server.events.removeAllListeners();
    });

    it("confirms and removes an establishment", async () => {
      const user = userEvent.setup();
      let removedIds: string[] = [];
      server.use(removeHandler((ids) => (removedIds = ids)));

      await renderSection();
      await user.click(screen.getAllByRole("button", { name: copy.remove })[0]);

      expect(
        screen.getByRole("heading", { name: copy.removeTitle }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(copy.removeDescription("Comedor Los Bajitos")),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: copy.confirmRemove }),
      );
      await waitFor(() => expect(removedIds).toEqual(["est-1"]));
      await waitFor(() =>
        expect(
          screen.queryByRole("heading", { name: copy.removeTitle }),
        ).not.toBeInTheDocument(),
      );
    });

    it("keeps the confirm dialog open with an error when removal fails", async () => {
      const user = userEvent.setup();
      server.use(removeHandler(() => {}, 500));

      await renderSection();
      await user.click(screen.getAllByRole("button", { name: copy.remove })[0]);
      await user.click(
        screen.getByRole("button", { name: copy.confirmRemove }),
      );

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: copy.removeTitle }),
      ).toBeInTheDocument();
    });
  });

  it("offers analysts a link to propose a missing establishment", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(ESTABLISHMENTS_ENDPOINT, () =>
        HttpResponse.json({ items: [], total: 0, page: 1 }),
      ),
    );

    await renderWithProviders(<ProfilePage />);
    await user.click(
      await screen.findByRole("button", {
        name: MY_ESTABLISHMENTS.request.add,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: MY_ESTABLISHMENTS.search.button }),
    );

    expect(
      await screen.findByText(MY_ESTABLISHMENTS.search.noResults),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: MY_ESTABLISHMENTS.proposeLink }),
    ).toHaveAttribute("href", "/dashboard/establishments/propose");
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
          name: MY_ESTABLISHMENTS.request.remove,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: MY_ESTABLISHMENTS.subscribe.remove,
        }),
      ).not.toBeInTheDocument();
    });
  });
});
