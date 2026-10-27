import { expect, type Page } from "@playwright/test";

export class MenuPage {
  constructor(private readonly page: Page) {}

  private get sidebar() {
    return this.page.getByRole("complementary").filter({ visible: true });
  }

  async expectReady(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
    await expect(
      this.sidebar.getByRole("link", { name: "Inicio", exact: true }),
    ).toBeVisible();
  }

  async expectAdminLinks(present: boolean): Promise<void> {
    await this.expectReady();
    for (const name of ["Solicitudes", "Usuarios"]) {
      const link = this.sidebar.getByRole("link", { name, exact: true });
      if (present) await expect(link).toBeVisible();
      else await expect(link).toHaveCount(0);
    }
  }

  async logout(): Promise<void> {
    const expand = this.sidebar.getByRole("button", {
      name: "Expandir menú",
      exact: true,
    });
    if (await expand.count()) await expand.click();
    await this.sidebar
      .getByRole("button", { name: "Cerrar Sesión", exact: true })
      .click();
    await expect(this.page).toHaveURL(/\/signin$/);
  }
}
