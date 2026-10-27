import { expect, type Page } from "@playwright/test";
import { DEVICE_ID_STORAGE_KEY } from "../../constants/tokenStorage";
import type { Credentials } from "../support/env";

export class SignInPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto("/signin");
    await this.expectVisible();
  }

  async expectVisible(): Promise<void> {
    await expect
      .poll(
        () =>
          this.page.evaluate(
            (key) => Boolean(localStorage.getItem(key)),
            DEVICE_ID_STORAGE_KEY,
          ),
        {
          message: "authentication effect has initialized the device identity",
        },
      )
      .toBe(true);
    await expect(this.page.getByLabel(/^Email\s*\*?$/)).toBeVisible();
    await expect(this.page.getByLabel(/^Contraseña\s*\*?$/)).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: "Iniciar sesión", exact: true }),
    ).toBeVisible();
  }

  async submit(credentials: Credentials): Promise<void> {
    await this.page.getByLabel(/^Email\s*\*?$/).fill(credentials.email);
    await this.page.getByLabel(/^Contraseña\s*\*?$/).fill(credentials.password);
    await this.page
      .getByRole("button", { name: "Iniciar sesión", exact: true })
      .click();
  }
}
