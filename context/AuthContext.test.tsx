import { useState } from "react";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { seedAuthenticatedSession } from "@/test-utils";
import { server } from "@/mocks/server";
import { TOKENS_STORAGE_KEY } from "@/constants/tokenStorage";
import { BLOCKED_ACCOUNT_MESSAGE } from "@/constants/auth";
import { ERROR_TYPES } from "@/lib/apiError";

const PATH = "/api/v1/test-resource";

/** Calls `PATH` through the dispatcher under test and says when it is done. */
function Probe() {
  const {
    isAuthenticated,
    authNotice,
    makeAuthorizedRequest,
    makeAuthorizedDownload,
  } = useAuth();
  const [done, setDone] = useState(false);

  return (
    <>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="notice">{authNotice ?? ""}</span>
      <span data-testid="done">{String(done)}</span>
      <button
        onClick={() => makeAuthorizedRequest(PATH).then(() => setDone(true))}
      >
        request
      </button>
      <button
        onClick={() =>
          makeAuthorizedDownload(PATH)
            .catch(() => undefined)
            .then(() => setDone(true))
        }
      >
        download
      </button>
    </>
  );
}

const answerWith403 = (type: string) =>
  server.use(
    http.get(PATH, () =>
      HttpResponse.json(
        { type, status: 403, title: "Forbidden", detail: "x", instance: PATH },
        {
          status: 403,
          headers: { "Content-Type": "application/problem+json" },
        },
      ),
    ),
  );

const text = (testId: string) => screen.getByTestId(testId).textContent;

async function renderSignedIn(button: "request" | "download") {
  seedAuthenticatedSession();
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() => expect(text("authenticated")).toBe("true"));
  await userEvent.click(screen.getByRole("button", { name: button }));
  await waitFor(() => expect(text("done")).toBe("true"));
}

describe("AuthProvider when the account is blocked", () => {
  it.each(["request", "download"] as const)(
    "ends the session on a blocked answer to a %s",
    async (button) => {
      answerWith403(ERROR_TYPES.USER_BLOCKED);
      await renderSignedIn(button);

      expect(text("authenticated")).toBe("false");
      expect(text("notice")).toBe(BLOCKED_ACCOUNT_MESSAGE);
      expect(localStorage.getItem(TOKENS_STORAGE_KEY)).toBeNull();
    },
  );

  it.each(["request", "download"] as const)(
    "keeps the session on any other 403 to a %s",
    async (button) => {
      answerWith403(ERROR_TYPES.ROLE_NOT_ALLOWED);
      await renderSignedIn(button);

      expect(text("authenticated")).toBe("true");
      expect(text("notice")).toBe("");
      expect(localStorage.getItem(TOKENS_STORAGE_KEY)).not.toBeNull();
    },
  );
});
