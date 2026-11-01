import { ReactElement, ReactNode } from "react";
import { vi } from "vitest";
import { render, RenderOptions, screen } from "@testing-library/react";
import { server } from "@/mocks/server";
import { makeMeHandler } from "@/mocks/handlers/user";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SessionProvider, useSession } from "@/context/SessionContext";
import { TOKENS_STORAGE_KEY } from "@/constants/tokenStorage";
import { UserRole } from "@/types/user";

const SESSION_READY_TEST_ID = "session-ready";

/**
 * Puts the app in the state it reaches after a successful sign-in, so
 * `AuthProvider`'s boot effect refreshes the stored token instead of leaving
 * the tree unauthenticated.
 */
export function seedAuthenticatedSession() {
  localStorage.setItem(
    TOKENS_STORAGE_KEY,
    JSON.stringify({
      accessToken: "access_token",
      refreshToken: "refresh_token",
      tokenType: "bearer",
    }),
  );
}

/** Marks the tree as settled so `renderWithProviders` can await the role. */
function SessionReadyProbe() {
  const { isLoading } = useSession();
  if (isLoading) return null;
  return <div data-testid={SESSION_READY_TEST_ID} />;
}

/**
 * Mirrors `app/dashboard/layout.tsx`: the session only starts resolving once
 * auth has settled. Mounting `SessionProvider` earlier would let it settle
 * against `isAuthenticated: false` and report "no role" before the token
 * refresh even finishes.
 */
function AuthenticatedTree({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing || !isAuthenticated) return null;

  return (
    <SessionProvider>
      <SessionReadyProbe />
      {children}
    </SessionProvider>
  );
}

type ProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  /** Role `GET /users/me` answers with. Defaults to the handler's admin. */
  role?: UserRole;
};

/**
 * Renders `ui` inside the real auth + session providers, with `/users/me`
 * answering as `role`. Resolves once the session has settled, so assertions
 * never race the role-dependent render.
 */
export async function renderWithProviders(
  ui: ReactElement,
  { role, ...options }: ProvidersOptions = {},
) {
  if (role) server.use(makeMeHandler({ data: { role } }));
  seedAuthenticatedSession();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>
      <AuthenticatedTree>{children}</AuthenticatedTree>
    </AuthProvider>
  );

  const result = render(ui, { wrapper, ...options });
  await screen.findByTestId(SESSION_READY_TEST_ID);
  return result;
}

export * from "@testing-library/react";

/**
 * jsdom implements neither `URL.createObjectURL` nor `revokeObjectURL`, and
 * `saveBlob` needs both to start a download, plus a click on a throwaway `<a>`.
 * Stubs all three; `vitest.setup.ts` puts them back after every test. Patches
 * the two statics rather than the `URL` global: MSW builds `new URL(...)` on
 * every request.
 */
export function mockBlobDownload() {
  const createObjectURL = vi.fn(() => "blob:mock");
  const revokeObjectURL = vi.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  return {
    createObjectURL,
    revokeObjectURL,
    click,
    /** The `<a>` elements that were clicked, in order: `download` is the file name. */
    anchors: () => click.mock.instances as HTMLAnchorElement[],
  };
}
