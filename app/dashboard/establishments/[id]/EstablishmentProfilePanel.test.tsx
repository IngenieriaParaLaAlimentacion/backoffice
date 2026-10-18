import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import EstablishmentProfilePanel from "./EstablishmentProfilePanel";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  MOCK_CHARACTERIZATION,
  MOCK_ESTABLISHMENTS,
  resetCharacterizations,
} from "@/mocks/fixtures/establishment";
import { ESTABLISHMENT_CHARACTERIZATION_ENDPOINT } from "@/constants/api";
import { ESTABLISHMENT_PROFILE as COPY } from "@/constants/establishments";
import { EMPTY_CHARACTERIZATION } from "@/schemas/establishmentCharacterization.schema";
import { EstablishmentCharacterization } from "@/types/establishment";

const PATH = "/dashboard/establishments/x/profile";
const nav = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => PATH,
  useSearchParams: () => nav.params,
}));

const EMPTY_ID = MOCK_ESTABLISHMENTS[1].id;

function renderPanel({
  characterization = MOCK_CHARACTERIZATION,
  role,
  editing = false,
  onSaved = vi.fn(),
}: {
  characterization?: EstablishmentCharacterization;
  role?: "admin" | "analyst";
  editing?: boolean;
  onSaved?: ReturnType<typeof vi.fn>;
} = {}) {
  nav.params = new URLSearchParams(editing ? "edit=1" : "");
  return renderWithProviders(
    <EstablishmentProfilePanel
      establishmentId={EMPTY_ID}
      characterization={characterization}
      status={
        characterization === EMPTY_CHARACTERIZATION ? "pending" : "complete"
      }
      onSaved={onSaved}
    />,
    { role },
  );
}

describe("EstablishmentProfilePanel", () => {
  beforeEach(() => nav.replace.mockClear());
  afterEach(() => resetCharacterizations());

  it("shows answered fields and flags the unanswered ones", async () => {
    await renderPanel({ role: "analyst" });

    expect(
      screen.getByText("Olla popular / merendero / comedor / copa de leche"),
    ).toBeInTheDocument();
    expect(screen.getByText("Otro: Ropero comunitario")).toBeInTheDocument();
    expect(screen.getByText("Uriburu y Azcuénaga")).toBeInTheDocument();
    // Opening hours: weekdays collapsed, times as stored.
    expect(screen.getByText("Lun a Vie")).toBeInTheDocument();
    expect(screen.getByText("11:30 a 14:30")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("Ollas de gran capacidad")).toBeInTheDocument();
    // Identidad cultural is left blank in the fixture.
    expect(screen.getByText(COPY.unanswered)).toBeInTheDocument();
  });

  it("is read-only for an analyst, even with ?edit=1 in the URL", async () => {
    await renderPanel({ role: "analyst", editing: true });

    expect(
      screen.queryByRole("button", { name: COPY.edit }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: COPY.save }),
    ).not.toBeInTheDocument();
  });

  it("enters edit mode through the URL for an admin", async () => {
    await renderPanel({ role: "admin" });

    await userEvent.click(screen.getByRole("button", { name: COPY.edit }));
    expect(nav.replace).toHaveBeenCalledWith(`${PATH}?edit=1`, {
      scroll: false,
    });
  });

  it("offers to complete a pending profile only to whoever can edit it", async () => {
    const { unmount } = await renderPanel({
      characterization: EMPTY_CHARACTERIZATION,
      role: "analyst",
    });
    expect(screen.getByText(COPY.emptyBodyReader)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: COPY.completeAction }),
    ).not.toBeInTheDocument();
    unmount();

    await renderPanel({
      characterization: EMPTY_CHARACTERIZATION,
      role: "admin",
    });
    expect(
      screen.getByRole("button", { name: COPY.completeAction }),
    ).toBeInTheDocument();
  });

  it("saves a partial profile and drops an 'Otro' text left behind", async () => {
    let body: EstablishmentCharacterization | undefined;
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "PUT") body = await request.clone().json();
    });
    const onSaved = vi.fn();
    await renderPanel({
      characterization: EMPTY_CHARACTERIZATION,
      role: "admin",
      editing: true,
      onSaved,
    });
    const user = userEvent.setup();

    const types = screen.getByRole("group", { name: COPY.fields.spaceTypes });
    await user.click(within(types).getByRole("button", { name: "FinES" }));
    await user.click(within(types).getByRole("button", { name: "Otro" }));
    await user.type(
      screen.getByRole("textbox", { name: `${COPY.fields.spaceTypes}: Otro` }),
      "Biblioteca",
    );
    // Unticking "Otro" hides the text, and it must not reach the backend.
    await user.click(within(types).getByRole("button", { name: "Otro" }));
    await user.type(
      screen.getByRole("textbox", { name: COPY.fields.dailyAttendance }),
      "40",
    );
    await user.type(
      screen.getByRole("textbox", { name: COPY.fields.cooksPerService }),
      "3",
    );
    const equipment = screen.getByRole("group", {
      name: COPY.fields.kitchenEquipment,
    });
    await user.click(within(equipment).getByRole("button", { name: "Horno" }));
    // A blank opening-hours row is dropped, not flagged.
    await user.click(screen.getByRole("button", { name: COPY.hours.addSlot }));
    await user.click(screen.getByRole("button", { name: COPY.save }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(body).toMatchObject({
      space_types: ["fines"],
      space_types_other: null,
      daily_attendance: 40,
      cooks_per_service: 3,
      kitchen_equipment: ["oven"],
      opening_hours: [],
      contact_email: null,
    });
    expect(onSaved.mock.calls[0][0].characterization_status).toBe("complete");
    expect(nav.replace).toHaveBeenCalledWith(PATH, { scroll: false });
    server.events.removeAllListeners();
  });

  it("flags a half-filled opening-hours row next to it", async () => {
    await renderPanel({
      characterization: EMPTY_CHARACTERIZATION,
      role: "admin",
      editing: true,
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: COPY.hours.addSlot }));
    const row = screen.getByRole("listitem", { name: COPY.hours.slotLabel(1) });
    await user.click(within(row).getByRole("button", { name: "Lunes" }));
    await user.click(screen.getByRole("button", { name: COPY.save }));

    expect(
      await within(row).findByText(COPY.hours.timesRequired),
    ).toBeInTheDocument();
  });

  it("rejects an invalid contact email before calling the backend", async () => {
    await renderPanel({
      characterization: EMPTY_CHARACTERIZATION,
      role: "admin",
      editing: true,
    });
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: COPY.fields.contactEmail }),
      "no-es-un-mail",
    );
    await user.click(screen.getByRole("button", { name: COPY.save }));

    expect(await screen.findByText(COPY.invalidEmail)).toBeInTheDocument();
  });

  it("pins a 422 on the field it names and keeps what was typed", async () => {
    server.use(
      http.put(ESTABLISHMENT_CHARACTERIZATION_ENDPOINT(":id"), () =>
        HttpResponse.json(
          {
            type: "/errors/validation-failed",
            title: "Validation failed",
            status: 422,
            detail: "Validation failed",
            field: "premises_other",
          },
          { status: 422 },
        ),
      ),
    );
    await renderPanel({
      characterization: EMPTY_CHARACTERIZATION,
      role: "admin",
      editing: true,
    });
    const user = userEvent.setup();

    const premises = screen.getByRole("group", { name: COPY.fields.premises });
    await user.click(within(premises).getByRole("button", { name: "Otro" }));
    const other = screen.getByRole("textbox", {
      name: `${COPY.fields.premises}: Otro`,
    });
    await user.type(other, "Parroquia");
    await user.click(screen.getByRole("button", { name: COPY.save }));

    expect(await screen.findByText(COPY.invalidField)).toBeInTheDocument();
    expect(other).toHaveValue("Parroquia");
    expect(other).toHaveAttribute("aria-invalid", "true");
  });
});
