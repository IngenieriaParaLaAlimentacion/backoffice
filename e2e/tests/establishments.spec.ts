import {
  ESTABLISHMENT_CHARACTERIZATION_ENDPOINT,
  ESTABLISHMENT_DASHBOARD_ENDPOINT,
  ESTABLISHMENT_ENDPOINT,
} from "../../constants/api";
import { test, expect } from "../flow-fixtures";
import { EstablishmentsPage } from "../pages/establishments.page";
import { installGeoref } from "../support/georef";
import type { EstablishmentResponse } from "../../types/establishment";

test.describe("CA1 admin establishments", () => {
  test.use({ role: "admin" });

  test("creates through Georef and remains in the list after reload", async ({
    page,
    flow,
    api,
  }) => {
    const ui = new EstablishmentsPage(page);
    const name = flow.name("created");
    const address = await installGeoref(page, flow.name("create-place"));
    await ui.newEstablishment();
    const created = await ui.create(name, address.formattedAddress);
    expect(created.name).toBe(name);
    expect(created.place_id).toBe(address.placeId);
    await ui.search(name);
    await expect(ui.row(name)).toContainText(address.formattedAddress);
    await page.reload();
    await expect(ui.row(name)).toBeVisible();
    const read = await api.request("GET", ESTABLISHMENT_ENDPOINT(created.id));
    expect(read.status()).toBe(200);
    expect(await read.json()).toMatchObject({
      id: created.id,
      name,
      place_id: address.placeId,
    });
  });

  test("empty creation stays disabled; selected address exposes touched name validation", async ({
    page,
    flow,
  }) => {
    const ui = new EstablishmentsPage(page);
    const address = await installGeoref(page, flow.name("validation-place"));
    await ui.newEstablishment();
    const submit = page.getByRole("button", {
      name: "Crear establecimiento",
      exact: true,
    });
    await expect(submit).toBeDisabled();
    await ui.pickAddress(address.formattedAddress);
    const name = page.getByRole("textbox", { name: /^Nombre\s*\*?$/ });
    await name.focus();
    await name.blur();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(
      page.getByText("El nombre es requerido", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/establishments\/create$/);
  });

  test("edits name and normalized address on the same persisted establishment", async ({
    page,
    flow,
    api,
  }) => {
    const own = await flow.establishment("edit");
    const name = flow.name("edited");
    const address = await installGeoref(page, flow.name("edit-place"));
    const ui = new EstablishmentsPage(page);
    await ui.open(own.id, own.name);
    await ui.edit(own.id, name, address.formattedAddress);
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(address.formattedAddress, { exact: true }),
    ).toBeVisible();
    const read = await api.request("GET", ESTABLISHMENT_ENDPOINT(own.id));
    expect(read.status()).toBe(200);
    expect((await read.json()) as EstablishmentResponse).toMatchObject({
      id: own.id,
      name,
      formatted_address: address.formattedAddress,
      place_id: address.placeId,
      city: address.city,
      province: address.province,
    });
  });
});

test.describe("CA1 analyst characterization", () => {
  test.use({ role: "analyst" });

  test("saves private establishment characterization without general-data editing", async ({
    page,
    flow,
    api,
  }) => {
    const own = await flow.establishment("analyst-profile");
    const neighborhood = flow.name("barrio");
    await page.goto(`/dashboard/establishments/${own.id}/profile`);
    await expect(
      page.getByRole("heading", { level: 1, name: own.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Editar datos", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Completar perfil", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Barrio", exact: true })
      .fill(neighborhood);
    const saved = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname ===
          ESTABLISHMENT_CHARACTERIZATION_ENDPOINT(own.id) &&
        r.request().method() === "PUT",
    );
    await page
      .getByRole("button", { name: "Guardar perfil", exact: true })
      .click();
    expect((await saved).status()).toBe(200);
    await expect(
      page.getByRole("button", { name: "Guardar perfil", exact: true }),
    ).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(neighborhood, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Editar datos", exact: true }),
    ).toHaveCount(0);
    const read = await api.request(
      "GET",
      ESTABLISHMENT_DASHBOARD_ENDPOINT(own.id),
    );
    expect(read.status()).toBe(200);
    expect(await read.json()).toMatchObject({
      establishment: {
        id: own.id,
        name: own.name,
        formatted_address: own.formatted_address,
      },
      characterization: { neighborhood },
    });
  });
});
