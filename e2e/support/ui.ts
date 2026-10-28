import { expect, type Page } from "@playwright/test";

// Existing application copy that has no production constant yet. Keep E2E
// selectors together without changing production components for test tooling.
export const E2E_UI = {
  welcome: "¡Bienvenido!",
  signIn: {
    email: /^Email\s*\*?$/,
    password: /^Contraseña\s*\*?$/,
    submit: "Iniciar sesión",
  },
  sidebar: { expand: "Expandir menú", logout: "Cerrar Sesión" },
} as const;

export async function expectLoaded(page: Page): Promise<void> {
  await expect(
    page.getByRole("heading", { name: E2E_UI.welcome, exact: true }),
  ).toBeVisible();
}
