import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import {
  ADMIN_LOGIN_ENDPOINT,
  LOGOUT_ENDPOINT,
  ME_ENDPOINT,
  REFRESH_ENDPOINT,
} from "../../constants/api";
import { SIGN_IN_FORM } from "../../constants/auth";
import {
  DEVICE_ID_STORAGE_KEY,
  TOKENS_STORAGE_KEY,
} from "../../constants/tokenStorage";
import { ERROR_TYPES } from "../../lib/apiError";
import { SignInPage } from "../pages/sign-in.page";
import { MenuPage } from "../pages/menu.page";
import { e2eEnv, type TestRole } from "../support/env";
import { currentTokens } from "../support/session";

for (const role of [
  "admin",
  "analyst",
] as const satisfies readonly TestRole[]) {
  test(`real UI login as ${role}`, async ({ page, context }) => {
    const form = new SignInPage(page);
    await form.open();
    const login = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        new URL(r.url()).pathname === ADMIN_LOGIN_ENDPOINT,
    );
    await form.submit(e2eEnv.credentials(role));
    expect((await login).status()).toBe(200);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "¡Bienvenido!", exact: true }),
    ).toBeVisible();
    const tokens = await currentTokens(context);
    const profile = await context.request.get(
      new URL(ME_ENDPOINT, e2eEnv.apiURL).toString(),
      {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      },
    );
    expect(profile.status()).toBe(200);
    expect((await profile.json()).role).toBe(role);
    await new MenuPage(page).expectAdminLinks(role === "admin");
  });

  test(`real UI logout as ${role}`, async ({ page, context }) => {
    const form = new SignInPage(page);
    await form.open();
    await form.submit(e2eEnv.credentials(role));
    await expect(
      page.getByRole("heading", { name: "¡Bienvenido!", exact: true }),
    ).toBeVisible();
    const beforeLogout = await currentTokens(context);
    const deviceId = await page.evaluate(
      (key) => localStorage.getItem(key),
      DEVICE_ID_STORAGE_KEY,
    );
    if (!deviceId) throw new Error("Missing owned UI-login device identity");
    const logout = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        new URL(r.url()).pathname === LOGOUT_ENDPOINT,
    );
    await new MenuPage(page).logout();
    expect((await logout).status()).toBe(204);
    const revokedRefresh = await context.request.post(
      new URL(REFRESH_ENDPOINT, e2eEnv.apiURL).toString(),
      {
        data: { refresh_token: beforeLogout.refreshToken, device_id: deviceId },
      },
    );
    expect(revokedRefresh.status()).toBe(401);
    await form.expectVisible();
    expect(
      await page.evaluate(
        (key) => localStorage.getItem(key),
        TOKENS_STORAGE_KEY,
      ),
    ).toBeNull();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin$/);
  });
}

test("incorrect password is rejected by the real API", async ({ page }) => {
  const form = new SignInPage(page);
  await form.open();
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      new URL(r.url()).pathname === ADMIN_LOGIN_ENDPOINT,
  );
  await form.submit({
    ...e2eEnv.credentials("admin"),
    password: "intentionally-wrong-e2e-password",
  });
  expect((await response).status()).toBe(401);
  await expect(page.getByRole("alert")).toContainText(
    SIGN_IN_FORM.errors[ERROR_TYPES.INVALID_CREDENTIALS],
  );
  await expect(page).toHaveURL(/\/signin$/);
});

test("anonymous protected navigation redirects to signin", async ({ page }) => {
  await page.goto("/dashboard/requests");
  await expect(page).toHaveURL(/\/signin$/);
  await new SignInPage(page).expectVisible();
});

test("invalid persisted refresh redirects to signin", async ({ page }) => {
  await new SignInPage(page).open();
  await page.evaluate(
    ({ tokenKey, deviceKey, deviceId }) => {
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: "invalid",
          refreshToken: "invalid",
          tokenType: "bearer",
        }),
      );
      localStorage.setItem(deviceKey, deviceId);
    },
    {
      tokenKey: TOKENS_STORAGE_KEY,
      deviceKey: DEVICE_ID_STORAGE_KEY,
      deviceId: randomUUID(),
    },
  );
  const refresh = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      new URL(r.url()).pathname === REFRESH_ENDPOINT,
  );
  await page.goto("/dashboard");
  expect((await refresh).status()).toBe(401);
  await expect(page).toHaveURL(/\/signin$/);
  await new SignInPage(page).expectVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), TOKENS_STORAGE_KEY),
  ).toBeNull();
});

test("bad access with valid refresh recovers instead of an invalid-session false positive", async ({
  page,
  context,
}) => {
  const form = new SignInPage(page);
  await form.open();
  await form.submit(e2eEnv.credentials("admin"));
  await expect(
    page.getByRole("heading", { name: "¡Bienvenido!", exact: true }),
  ).toBeVisible();
  const before = await currentTokens(context);
  await page.evaluate((key) => {
    const tokens = JSON.parse(localStorage.getItem(key)!);
    tokens.accessToken = "invalid";
    localStorage.setItem(key, JSON.stringify(tokens));
  }, TOKENS_STORAGE_KEY);
  const refresh = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      new URL(r.url()).pathname === REFRESH_ENDPOINT,
  );
  await page.goto("/dashboard");
  expect((await refresh).status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "¡Bienvenido!", exact: true }),
  ).toBeVisible();
  expect(
    (await currentTokens(context)).refreshToken !== before.refreshToken,
  ).toBe(true);
});
