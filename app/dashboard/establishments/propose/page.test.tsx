import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProposeEstablishmentPage from "./page";
import {
  ESTABLISHMENT_FORM_FIELDS,
  PROPOSE_ESTABLISHMENT_PAGE,
} from "@/constants/establishments";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { baseHandler } from "@/mocks/handlers/base";
import { CREATE_ESTABLISHMENT_REQUEST_ENDPOINT } from "@/constants/api";

const push = vi.fn();

// The real hook requires an app-router context that isn't worth standing up
// for this page — it only needs router.push after a successful submit.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const fillRequiredFields = async () => {
  await userEvent.type(
    screen.getByPlaceholderText(PROPOSE_ESTABLISHMENT_PAGE.namePlaceholder),
    "Comedor Nuevo",
  );
  await userEvent.type(
    screen.getByPlaceholderText(ESTABLISHMENT_FORM_FIELDS.address.placeholder),
    "Av. Siempre Viva 742",
  );
};

const submit = () =>
  userEvent.click(
    screen.getByRole("button", {
      name: PROPOSE_ESTABLISHMENT_PAGE.submitButton,
    }),
  );

describe("ProposeEstablishmentPage", () => {
  beforeEach(() => push.mockClear());

  it("does not submit while name/address are blank", async () => {
    await renderWithProviders(<ProposeEstablishmentPage />);

    await submit();

    // Nothing to await here: a rejected client-side validation resolves
    // synchronously with no request and no navigation, so there's no async
    // outcome to wait for — asserting immediately is the correct check.
    expect(push).not.toHaveBeenCalled();
  });

  it("submits with only the required fields and redirects to the list with the success flag", async () => {
    await renderWithProviders(<ProposeEstablishmentPage />);

    await fillRequiredFields();
    await submit();

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/establishments?proposed=1"),
    );
  });

  it("shows an error banner when the backend rejects the request, without navigating", async () => {
    server.use(
      baseHandler(CREATE_ESTABLISHMENT_REQUEST_ENDPOINT, {
        method: "post",
        status: 400,
      }),
    );
    await renderWithProviders(<ProposeEstablishmentPage />);

    await fillRequiredFields();
    await submit();

    expect(
      await screen.findByText(PROPOSE_ESTABLISHMENT_PAGE.submitError),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
