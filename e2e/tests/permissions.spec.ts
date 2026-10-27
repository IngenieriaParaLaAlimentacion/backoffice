import { test, expect } from "../fixtures";
import {
  LIST_USERS_ENDPOINT,
  PENDING_ESTABLISHMENT_ACCESS_ENDPOINT,
} from "../../constants/api";
import { FORBIDDEN_SCREEN } from "../../constants/permissions";
import { ESTABLISHMENTS_LIST_PAGE } from "../../constants/establishments";
import { SURVEYS_PAGE, SURVEY_FORM } from "../../constants/surveys";
import { MenuPage } from "../pages/menu.page";

for (const role of ["admin", "analyst"] as const) {
  test.describe(`${role} navigation`, () => {
    test.use({ role });
    test("shows exactly the permitted primary menu", async ({ page }) => {
      await new MenuPage(page).expectAdminLinks(role === "admin");
    });
  });
}

test.describe("administrator controls", () => {
  test.use({ role: "admin" });
  for (const [path, heading] of [
    ["/dashboard/requests", "Solicitudes de usuario"],
    ["/dashboard/users", "Usuarios"],
  ] as const) {
    test(`can enter ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: FORBIDDEN_SCREEN.title,
          exact: true,
        }),
      ).toHaveCount(0);
    });
  }
  test("can see the admin-only establishment creation action", async ({
    page,
  }) => {
    await page.goto("/dashboard/establishments");
    await expect(
      page.getByRole("heading", {
        name: ESTABLISHMENTS_LIST_PAGE.title,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: ESTABLISHMENTS_LIST_PAGE.createButton,
        exact: true,
      }),
    ).toBeVisible();
  });
  test("can see survey deletion for its private API-created fixture", async ({
    page,
    api,
  }) => {
    const survey = await api.survey("admin-delete-affordance");
    await page.goto("/dashboard/surveys");
    await page
      .getByPlaceholder(SURVEYS_PAGE.searchPlaceholder, { exact: true })
      .fill(survey.name);
    const row = page
      .getByRole("row")
      .filter({ has: page.getByText(survey.name, { exact: true }) });
    await expect(row).toBeVisible();
    await row
      .getByRole("button", { name: SURVEYS_PAGE.actionsMenuLabel, exact: true })
      .click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: SURVEY_FORM.delete, exact: true }),
    ).toBeVisible();
  });
});

test.describe("analyst restrictions", () => {
  test.use({ role: "analyst" });
  for (const path of [
    "/dashboard/requests",
    "/dashboard/requests/establishments",
    "/dashboard/requests/establishment-creations",
    "/dashboard/users",
    "/dashboard/establishments/create",
  ]) {
    test(`renders forbidden when directly navigating to ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new URL(path, page.url()).toString());
      await expect(
        page.getByRole("heading", {
          name: FORBIDDEN_SCREEN.title,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: FORBIDDEN_SCREEN.backToHome,
          exact: true,
        }),
      ).toBeVisible();
    });
  }
  for (const path of [
    LIST_USERS_ENDPOINT,
    PENDING_ESTABLISHMENT_ACCESS_ENDPOINT,
  ]) {
    test(`backend refuses administrative GET ${path}`, async ({ api }) => {
      const response = await api.request("GET", path);
      expect(response.status()).toBe(403);
      expect((await response.json()).status).toBe(403);
    });
  }
  test("does not offer admin-only establishment creation", async ({ page }) => {
    await page.goto("/dashboard/establishments");
    await expect(
      page.getByRole("heading", {
        name: ESTABLISHMENTS_LIST_PAGE.title,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: ESTABLISHMENTS_LIST_PAGE.createButton,
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", {
        name: ESTABLISHMENTS_LIST_PAGE.proposeButton,
        exact: true,
      }),
    ).toBeVisible();
  });
  test("retains legitimate survey actions while hiding deletion", async ({
    page,
    api,
  }) => {
    const survey = await api.survey("analyst-delete-affordance");
    await page.goto("/dashboard/surveys");
    await expect(
      page.getByRole("heading", { name: SURVEYS_PAGE.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: SURVEYS_PAGE.createSurvey,
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByPlaceholder(SURVEYS_PAGE.searchPlaceholder, { exact: true })
      .fill(survey.name);
    const row = page
      .getByRole("row")
      .filter({ has: page.getByText(survey.name, { exact: true }) });
    await expect(row).toBeVisible();
    await row
      .getByRole("button", { name: SURVEYS_PAGE.actionsMenuLabel, exact: true })
      .click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: SURVEYS_PAGE.edit, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: SURVEY_FORM.delete, exact: true }),
    ).toHaveCount(0);
  });
});
