import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SurveyForm from "@/components/surveys/SurveyForm";
import { SURVEY_FORM } from "@/constants/surveys";
import { renderWithProviders } from "@/test-utils";

describe("SurveyForm", () => {
  it("preserves locked response settings when submitting an existing survey", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    await renderWithProviders(
      <SurveyForm
        defaultValues={{
          name: "Encuesta",
          description: "",
          response_target: "anonymous",
          requires_response_number: true,
          questions: [
            {
              id: "question-1",
              text: "Pregunta",
              response_type: "text",
              is_required: false,
              options: [],
            },
          ],
        }}
        onSubmit={onSubmit}
        hasResponses
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: SURVEY_FORM.save }),
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        response_target: "anonymous",
        requires_response_number: true,
      }),
    );
  });
});
