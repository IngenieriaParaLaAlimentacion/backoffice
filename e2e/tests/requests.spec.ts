import {
  ESTABLISHMENTS_ENDPOINT,
  ESTABLISHMENT_ENDPOINT,
  ESTABLISHMENT_FIELD_WORKERS_ENDPOINT,
  GET_USER_ENDPOINT,
  LIST_ESTABLISHMENT_REQUESTS_ENDPOINT,
} from "../../constants/api";
import { test, expect } from "../flow-fixtures";
import { RequestsPage } from "../pages/requests.page";
import {
  ESTABLISHMENT_DASHBOARD_PAGE,
  ESTABLISHMENTS_LIST_PAGE,
} from "../../constants/establishments";
import { EstablishmentsPage } from "../pages/establishments.page";
import { installGeoref } from "../support/georef";

test.use({ role: "admin" });

test("approves an owned pending creation request into a persistent establishment", async ({
  page,
  flow,
  api,
}) => {
  const own = await flow.establishmentRequest("approve");
  const address = await installGeoref(page, flow.name("approved-place"));
  const ui = new RequestsPage(page);
  const created = await ui.approveCreation(
    own.id,
    own.name,
    address.formattedAddress,
  );
  expect(created).toMatchObject({
    name: own.name,
    place_id: address.placeId,
    reused: false,
  });
  const read = await api.request("GET", ESTABLISHMENT_ENDPOINT(created.id));
  expect(read.status()).toBe(200);
  expect(await read.json()).toMatchObject({ id: created.id, name: own.name });
  await page.goto("/dashboard/establishments");
  const list = new EstablishmentsPage(page);
  await list.search(own.name);
  await expect(list.row(own.name)).toBeVisible();
  await page.reload();
  await expect(list.row(own.name)).toBeVisible();
  const reviewed = await api.request(
    "GET",
    `${LIST_ESTABLISHMENT_REQUESTS_ENDPOINT}?status=approved&search=${encodeURIComponent(own.name)}`,
  );
  expect(reviewed.status()).toBe(200);
  expect((await reviewed.json()).items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: own.id, status: "approved" }),
    ]),
  );
});

test("rejects an owned request without creating an establishment", async ({
  page,
  flow,
  api,
}) => {
  const own = await flow.establishmentRequest("reject");
  await new RequestsPage(page).rejectCreation(own.id, own.name);
  const reviewed = await api.request(
    "GET",
    `${LIST_ESTABLISHMENT_REQUESTS_ENDPOINT}?status=rejected&search=${encodeURIComponent(own.name)}`,
  );
  expect(reviewed.status()).toBe(200);
  expect((await reviewed.json()).items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: own.id, status: "rejected" }),
    ]),
  );
  const absent = await api.request(
    "GET",
    `${ESTABLISHMENTS_ENDPOINT}?search=${encodeURIComponent(own.name)}`,
  );
  expect(absent.status()).toBe(200);
  expect((await absent.json()).total).toBe(0);
  await page.goto("/dashboard/establishments");
  const list = new EstablishmentsPage(page);
  await list.search(own.name);
  await expect(
    page.getByText(ESTABLISHMENTS_LIST_PAGE.noEstablishments, { exact: true }),
  ).toBeVisible();
  await expect(list.row(own.name)).toHaveCount(0);
});

test("activates a fresh worker, separately approves access, then revokes it from ficha", async ({
  page,
  flow,
  api,
}) => {
  const own = await flow.establishment("worker-access");
  const worker = await flow.fieldWorker([own.id]);
  const ui = new RequestsPage(page);
  await ui.activateWorker(worker.id, worker.email);
  const active = await api.request("GET", GET_USER_ENDPOINT(worker.id));
  expect(active.status()).toBe(200);
  expect(await active.json()).toMatchObject({
    id: worker.id,
    status: "active",
  });
  const pending = await api.request(
    "GET",
    `${ESTABLISHMENT_FIELD_WORKERS_ENDPOINT(own.id)}?relation_status=pending&search=${encodeURIComponent(worker.email)}`,
  );
  expect(pending.status()).toBe(200);
  expect((await pending.json()).items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: worker.id, relation_status: "pending" }),
    ]),
  );
  await ui.approveAccess(worker.id, worker.email, own.name);
  await page.goto(`/dashboard/establishments/${own.id}/field-workers`);
  await expect(ui.row(worker.email)).toContainText("Aprobado");
  await ui.revoke(worker.id, worker.email, own.id);
  await page.reload();
  await expect(
    page.getByText(ESTABLISHMENT_DASHBOARD_PAGE.noFieldWorkers, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(ui.row(worker.email)).toHaveCount(0);
  const revoked = await api.request(
    "GET",
    `${ESTABLISHMENT_FIELD_WORKERS_ENDPOINT(own.id)}?relation_status=revoked&search=${encodeURIComponent(worker.email)}`,
  );
  expect(revoked.status()).toBe(200);
  expect((await revoked.json()).items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: worker.id,
        user_status: "active",
        relation_status: "revoked",
      }),
    ]),
  );
});
