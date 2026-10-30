import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProposeEstablishmentPage from "./page";
import {
  ESTABLISHMENT_FORM_FIELDS,
  ESTABLISHMENT_PROFILE,
  PROPOSE_ESTABLISHMENT_PAGE,
} from "@/constants/establishments";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { baseHandler } from "@/mocks/handlers/base";
import { CREATE_ESTABLISHMENT_REQUEST_ENDPOINT } from "@/constants/api";

const replace = vi.fn();

// The real hook requires an app-router context that isn't worth standing up
// for this page — it only needs router.replace after a successful submit.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
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
  beforeEach(() => replace.mockClear());

  it("does not submit while name/address are blank", async () => {
    await renderWithProviders(<ProposeEstablishmentPage />);

    await submit();

    // Nothing to await here: a rejected client-side validation resolves
    // synchronously with no request and no navigation, so there's no async
    // outcome to wait for — asserting immediately is the correct check.
    expect(replace).not.toHaveBeenCalled();
  });

  it("submits with only the required fields and redirects to the list with the success flag", async () => {
    await renderWithProviders(<ProposeEstablishmentPage />);

    await fillRequiredFields();
    await submit();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/dashboard/establishments?proposed=1",
      ),
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
    expect(replace).not.toHaveBeenCalled();
  });

  describe("optional profile", () => {
    const captureBody = () => {
      const sent: { body?: Record<string, unknown> } = {};
      server.events.on("request:start", async ({ request }) => {
        if (request.method === "POST") sent.body = await request.clone().json();
      });
      return sent;
    };

    afterEach(() => server.events.removeAllListeners());

    it("sends no profile when the section is left closed", async () => {
      const sent = captureBody();
      await renderWithProviders(<ProposeEstablishmentPage />);

      await fillRequiredFields();
      await submit();

      await waitFor(() => expect(replace).toHaveBeenCalled());
      expect(sent.body).not.toHaveProperty("characterization");
    });

    it("sends what was answered in the profile section", async () => {
      const sent = captureBody();
      await renderWithProviders(<ProposeEstablishmentPage />);
      const user = userEvent.setup();

      await fillRequiredFields();
      await user.click(screen.getByText(ESTABLISHMENT_PROFILE.optionalSection));
      const meals = screen.getByRole("group", {
        name: ESTABLISHMENT_PROFILE.fields.meals,
      });
      await user.click(within(meals).getByRole("button", { name: "Almuerzo" }));
      await submit();

      await waitFor(() => expect(replace).toHaveBeenCalled());
      expect(sent.body?.characterization).toMatchObject({
        meals: ["lunch"],
        space_types: [],
      });
    });

    it("opens the section to show a profile error instead of submitting", async () => {
      await renderWithProviders(<ProposeEstablishmentPage />);
      const user = userEvent.setup();

      await fillRequiredFields();
      await user.click(screen.getByText(ESTABLISHMENT_PROFILE.optionalSection));
      await user.type(
        screen.getByRole("textbox", {
          name: ESTABLISHMENT_PROFILE.fields.contactEmail,
        }),
        "no-es-un-mail",
      );
      // Closed again: the error must still be shown, not hidden inside it.
      await user.click(screen.getByText(ESTABLISHMENT_PROFILE.optionalSection));
      await submit();

      expect(
        await screen.findByText(ESTABLISHMENT_PROFILE.invalidEmail),
      ).toBeVisible();
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
