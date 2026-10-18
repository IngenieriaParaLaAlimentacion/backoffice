import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EstablishmentRequestReviewPanel from "./EstablishmentRequestReviewPanel";
import { renderWithProviders } from "@/test-utils";
import { DEFAULT_ESTABLISHMENT_REQUESTS_RESPONSE } from "@/mocks/fixtures/admin";
import {
  ESTABLISHMENT_PROFILE,
  ESTABLISHMENT_REQUEST_REVIEW_PANEL as COPY,
} from "@/constants/establishments";
import { EstablishmentRequestAdminView } from "@/types/admin";

const [WITH_PROFILE, WITHOUT_PROFILE] =
  DEFAULT_ESTABLISHMENT_REQUESTS_RESPONSE.items;

const renderPanel = (request: EstablishmentRequestAdminView) =>
  renderWithProviders(
    <EstablishmentRequestReviewPanel
      request={request}
      onClose={vi.fn()}
      onApproved={vi.fn()}
      onRejected={vi.fn()}
      onStale={vi.fn()}
    />,
  );

describe("EstablishmentRequestReviewPanel — proposed profile", () => {
  it("shows the proposed profile read-only", async () => {
    await renderPanel(WITH_PROFILE);
    const user = userEvent.setup();

    await user.click(screen.getByText(COPY.proposedProfile));

    expect(screen.getByText("Uriburu y Azcuénaga")).toBeInTheDocument();
    expect(screen.getByText("Lun a Vie")).toBeInTheDocument();
    // Corrections happen in the Perfil tab once approved, not here.
    expect(
      screen.queryByRole("button", { name: ESTABLISHMENT_PROFILE.save }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", {
        name: ESTABLISHMENT_PROFILE.fields.neighborhood,
      }),
    ).not.toBeInTheDocument();
  });

  it("says so when the requester proposed no profile", async () => {
    await renderPanel(WITHOUT_PROFILE);

    expect(screen.getByText(COPY.noProposedProfile)).toBeInTheDocument();
  });
});
