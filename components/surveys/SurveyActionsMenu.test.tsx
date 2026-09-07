import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SurveyActionsMenu from "@/components/surveys/SurveyActionsMenu";
import { SURVEY_FORM, SURVEYS_PAGE } from "@/constants/surveys";
import { SurveyListItem } from "@/types/survey";
import { renderWithProviders } from "@/test-utils";
import { UserRole } from "@/types/user";

// The menu only needs `router.push` for "Editar"; the real hook requires an
// app-router context that isn't worth standing up for a permission test.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const survey: SurveyListItem = {
  id: "survey-1",
  name: "Encuesta FIES",
  response_target: "subject",
  requires_response_number: true,
  is_active: true,
  created_by_id: "user-9",
  question_count: 8,
  response_count: 0,
  created_at: "2026-01-15T10:00:00Z",
};

async function openMenu(role: UserRole) {
  await renderWithProviders(
    <SurveyActionsMenu
      survey={survey}
      busy={false}
      onDuplicate={() => {}}
      onToggleStatus={() => {}}
      onDelete={() => {}}
    />,
    { role },
  );
  await userEvent.click(
    screen.getByTitle(SURVEYS_PAGE.actionsMenuLabel).closest("button")!,
  );
}

describe("SurveyActionsMenu", () => {
  beforeEach(() => localStorage.clear());

  // An analyst creates and edits surveys freely; only deleting is withheld.
  it("hides Eliminar from an analyst but keeps the editing actions", async () => {
    await openMenu("analyst");

    expect(
      await screen.findByRole("menuitem", { name: SURVEYS_PAGE.edit }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: SURVEYS_PAGE.duplicate }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: SURVEY_FORM.deactivate }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: SURVEY_FORM.delete }),
    ).not.toBeInTheDocument();
  });

  it("offers Eliminar to an admin", async () => {
    await openMenu("admin");

    expect(
      await screen.findByRole("menuitem", { name: SURVEY_FORM.delete }),
    ).toBeInTheDocument();
  });
});
