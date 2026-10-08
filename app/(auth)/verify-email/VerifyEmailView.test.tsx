import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import VerifyEmailView from "./VerifyEmailView";
import { server } from "@/mocks/server";
import { makeVerifyEmailHandler } from "@/mocks/handlers/auth";
import { VERIFY_EMAIL_ENDPOINT } from "@/constants/api";
import { ERROR_TYPES } from "@/lib/apiError";
import { VERIFY_EMAIL_PAGE as COPY } from "@/constants/auth";

const TOKEN = "verification-token";

const verifyButton = () =>
  screen.getByRole("button", { name: COPY.landing.submit });

const queryVerifyButton = () =>
  screen.queryByRole("button", { name: COPY.landing.submit });

const rejectWith = (type: string) =>
  makeVerifyEmailHandler({ status: 401, error: { type, detail: "x" } });

describe("VerifyEmailView", () => {
  // Mail scanners open links: a request on load would spend the token before
  // the person arrives.
  it("sends nothing until the button is pressed", async () => {
    const onRequest = vi.fn();
    server.use(makeVerifyEmailHandler({ onRequest }));

    render(<VerifyEmailView token={TOKEN} />);

    expect(
      screen.getByRole("heading", { name: COPY.landing.title }),
    ).toBeInTheDocument();
    expect(verifyButton()).toBeEnabled();
    // Let any stray effect or microtask run before asserting silence.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onRequest).not.toHaveBeenCalled();
  });

  it("posts the token on click and tells the user to go back to the app", async () => {
    const bodies: unknown[] = [];
    server.use(
      makeVerifyEmailHandler({
        onRequest: async (request) => {
          bodies.push(await request.clone().json());
        },
      }),
    );
    render(<VerifyEmailView token={TOKEN} />);

    await userEvent.click(verifyButton());

    expect(
      await screen.findByRole("heading", { name: COPY.success.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(COPY.nextSteps)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: COPY.signInLink })).toHaveAttribute(
      "href",
      "/signin",
    );
    expect(queryVerifyButton()).not.toBeInTheDocument();
    expect(bodies).toEqual([{ token: TOKEN }]);
  });

  it("disables the button while verifying and sends a single request", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const onRequest = vi.fn();
    server.use(
      http.post(VERIFY_EMAIL_ENDPOINT, async () => {
        onRequest();
        await gate;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(<VerifyEmailView token={TOKEN} />);

    const button = verifyButton();
    fireEvent.click(button);
    fireEvent.click(button);

    expect(
      await screen.findByRole("button", { name: COPY.landing.submitting }),
    ).toBeDisabled();

    release();

    expect(
      await screen.findByRole("heading", { name: COPY.success.title }),
    ).toBeInTheDocument();
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  // What a reload after a successful verification gets.
  it("treats an already used link as a neutral outcome", async () => {
    server.use(rejectWith(ERROR_TYPES.VERIFICATION_TOKEN_USED));
    render(<VerifyEmailView token={TOKEN} />);

    await userEvent.click(verifyButton());

    expect(
      await screen.findByRole("heading", { name: COPY.used.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(COPY.used.description)).toBeInTheDocument();
    expect(screen.getByText(COPY.nextSteps)).toBeInTheDocument();
    expect(queryVerifyButton()).not.toBeInTheDocument();
  });

  it.each([
    ERROR_TYPES.VERIFICATION_TOKEN_EXPIRED,
    ERROR_TYPES.INVALID_VERIFICATION_TOKEN,
  ])("ends the flow without a retry on %s", async (type) => {
    server.use(rejectWith(type));
    render(<VerifyEmailView token={TOKEN} />);

    await userEvent.click(verifyButton());

    expect(
      await screen.findByRole("heading", { name: COPY.failed.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(COPY.linkErrors[type])).toBeInTheDocument();
    expect(queryVerifyButton()).not.toBeInTheDocument();
    expect(screen.queryByText(COPY.nextSteps)).not.toBeInTheDocument();
  });

  it("keeps the button after a server error so the user can retry", async () => {
    // `once`: the second click falls through to the default 204 handler.
    server.use(makeVerifyEmailHandler({ status: 500, once: true }));
    render(<VerifyEmailView token={TOKEN} />);

    await userEvent.click(verifyButton());

    expect(await screen.findByText(COPY.submitError)).toBeInTheDocument();
    expect(verifyButton()).toBeEnabled();

    await userEvent.click(verifyButton());

    expect(
      await screen.findByRole("heading", { name: COPY.success.title }),
    ).toBeInTheDocument();
  });

  it("keeps the button when the request never reaches the server", async () => {
    server.use(http.post(VERIFY_EMAIL_ENDPOINT, () => HttpResponse.error()));
    render(<VerifyEmailView token={TOKEN} />);

    await userEvent.click(verifyButton());

    expect(await screen.findByText(COPY.submitError)).toBeInTheDocument();
    expect(verifyButton()).toBeEnabled();
  });

  it("shows the invalid-link screen, with no button, when the token is missing", () => {
    render(<VerifyEmailView />);

    expect(
      screen.getByRole("heading", { name: COPY.missingToken.title }),
    ).toBeInTheDocument();
    expect(queryVerifyButton()).not.toBeInTheDocument();
  });
});
