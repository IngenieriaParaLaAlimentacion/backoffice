import { expect, type Page } from "@playwright/test";
import { NAV_ITEMS } from "../../constants/navigation";
import { E2E_UI } from "../support/ui";

export class MenuPage {
  constructor(private readonly page: Page) {}

  private get sidebar() {
    return this.page.getByRole("complementary").filter({ visible: true });
  }

  private navLink(href: string) {
    const item = NAV_ITEMS.find((item) => item.href === href);
    if (!item) throw new Error(`Missing navigation item for ${href}`);
    return this.sidebar
      .getByRole("link", { name: item.label, exact: true })
      .and(this.sidebar.locator(`a[href="${href}"]`));
  }

  async expectReady(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
    await expect(this.navLink("/dashboard")).toBeVisible();
  }

  async expectAdminLinks(present: boolean): Promise<void> {
    await this.expectReady();
    for (const href of ["/dashboard/requests", "/dashboard/users"]) {
      const link = this.navLink(href);
      if (present) await expect(link).toBeVisible();
      else await expect(link).toHaveCount(0);
    }
  }

  async logout(): Promise<void> {
    const expand = this.sidebar.getByRole("button", {
      name: E2E_UI.sidebar.expand,
      exact: true,
    });
    if (await expand.count()) await expand.click();
    await this.sidebar
      .getByRole("button", { name: E2E_UI.sidebar.logout, exact: true })
      .click();
    await expect(this.page).toHaveURL(/\/signin$/);
  }
}
