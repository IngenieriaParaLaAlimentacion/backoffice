import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditEstablishmentDialog from "./EditEstablishmentDialog";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  MOCK_ESTABLISHMENTS,
  resetEstablishmentEdits,
} from "@/mocks/fixtures/establishment";
import { EDIT_ESTABLISHMENT_DIALOG as COPY } from "@/constants/establishments";
import { UpdateEstablishmentRequest } from "@/types/establishment";

// The real provider calls Georef; this one renders one button per place so a
// test can "pick" it.
const PLACES = vi.hoisted(() => ({
  fresh: {
    id: "fresh-place",
    formattedAddress: "Av. Belgrano 100, CABA",
    lat: -34.61,
    lng: -58.37,
  },
}));
vi.mock("@/lib/geo", () => ({
  geoLocationProvider: {
    mount(
      container: HTMLElement,
      callbacks: { onSelect: (place: unknown) => void },
    ) {
      const pick = (place: { id: string; formattedAddress: string }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = place.formattedAddress;
        button.onclick = () => callbacks.onSelect(place);
        container.appendChild(button);
      };
      pick(PLACES.fresh);
      // The second mock establishment's address: picking it must 409.
      pick({
        id: "ChIJW3nVgx-3vJURyNO4FWJALhB",
        formattedAddress: "Av. Rivadavia 5678, CABA",
      });
      return () => container.replaceChildren();
    },
  },
}));

const ESTABLISHMENT = MOCK_ESTABLISHMENTS[0];

async function openDialog(onSaved = vi.fn()) {
  await renderWithProviders(
    <EditEstablishmentDialog establishment={ESTABLISHMENT} onSaved={onSaved} />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: COPY.button }));
  return { user, onSaved };
}

function captureBody() {
  const sent: { body?: UpdateEstablishmentRequest } = {};
  server.events.on("request:start", async ({ request }) => {
    if (request.method === "PATCH") sent.body = await request.clone().json();
  });
  return sent;
}

describe("EditEstablishmentDialog", () => {
  afterEach(() => {
    resetEstablishmentEdits();
    server.events.removeAllListeners();
  });

  it("sends only the fields that changed", async () => {
    const sent = captureBody();
    const { user, onSaved } = await openDialog();

    const name = screen.getByRole("textbox", { name: /Nombre/ });
    await user.clear(name);
    await user.type(name, "Comedor Norte Renovado");
    await user.click(screen.getByRole("button", { name: COPY.save }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(sent.body).toEqual({ name: "Comedor Norte Renovado" });
    expect(onSaved.mock.calls[0][0].name).toBe("Comedor Norte Renovado");
  });

  it("says there is nothing to save instead of sending an empty PATCH", async () => {
    const sent = captureBody();
    const { user, onSaved } = await openDialog();

    await user.click(screen.getByRole("button", { name: COPY.save }));

    expect(await screen.findByText(COPY.noChanges)).toBeInTheDocument();
    expect(sent.body).toBeUndefined();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("sends a new address whole, with its place and coordinates", async () => {
    const sent = captureBody();
    const { user, onSaved } = await openDialog();

    await user.click(screen.getByRole("button", { name: COPY.changeAddress }));
    // Until a place is picked there is no address to save.
    expect(screen.getByRole("button", { name: COPY.save })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: PLACES.fresh.formattedAddress }),
    );
    await user.click(screen.getByRole("button", { name: COPY.save }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(sent.body).toEqual({
      formatted_address: PLACES.fresh.formattedAddress,
      place_id: PLACES.fresh.id,
      latitude: PLACES.fresh.lat,
      longitude: PLACES.fresh.lng,
    });
  });

  it("explains a 409 and keeps the dialog open with what was typed", async () => {
    const { user, onSaved } = await openDialog();

    await user.click(screen.getByRole("button", { name: COPY.changeAddress }));
    await user.click(
      screen.getByRole("button", { name: "Av. Rivadavia 5678, CABA" }),
    );
    await user.click(screen.getByRole("button", { name: COPY.save }));

    expect(await screen.findByText(COPY.addressTaken)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /Nombre/ })).toHaveValue(
      ESTABLISHMENT.name,
    );
  });
});
