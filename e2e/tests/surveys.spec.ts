import { waitForApi } from "../support/api";
import {
  SURVEY_ENDPOINT,
  SURVEY_RESPONSES_EXPORT_ENDPOINT,
  SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT,
} from "../../constants/api";
import { test, expect } from "../flow-fixtures";
import { SurveysPage } from "../pages/surveys.page";
import { assertDownload } from "../support/download";
import type {
  SurveyResponse,
  SurveyTemplateResponse,
  SurveyResponseDetail,
} from "../../types/survey";
import { RESPONSES_PAGE, SURVEY_FORM } from "../../constants/surveys";

function structure(
  survey: Pick<SurveyResponse | SurveyTemplateResponse, "questions">,
) {
  return [...survey.questions]
    .sort((a, b) => a.position - b.position)
    .map((q) => ({
      text: q.text,
      response_type: q.response_type,
      is_required: q.is_required,
      options: [...q.options]
        .sort((a, b) => a.position - b.position)
        .map((o) => o.text),
    }));
}

test.describe("authoring", () => {
  test.use({ role: "admin" });

  test("creates FIES-template structure, edits its name, changes status and duplicates the paused source", async ({
    page,
    flow,
    api,
  }) => {
    const ui = new SurveysPage(page);
    const { survey, template } = await ui.createFies(
      flow.name("fies-template", 100),
    );
    expect(survey.questions).toHaveLength(8);
    expect(structure(survey)).toEqual(structure(template));
    expect(survey.requires_response_number).toBe(
      template.requires_response_number,
    );
    expect(survey.response_target).toBe(template.response_target);
    const name = flow.name("renamed-fies", 100);
    await ui.rename(survey.id, name);
    await page.goto(`/dashboard/surveys/${survey.id}`);
    await expect(
      page.getByPlaceholder(SURVEY_FORM.namePlaceholder, { exact: true }),
    ).toHaveValue(name);
    await ui.setActive(survey.id, name, false);
    await ui.setActive(survey.id, name, true);
    await ui.setActive(survey.id, name, false);
    const originalResponse = await api.request(
      "GET",
      SURVEY_ENDPOINT(survey.id),
    );
    expect(originalResponse.status()).toBe(200);
    const original = (await originalResponse.json()) as SurveyResponse;
    expect(original).toMatchObject({ id: survey.id, name, is_active: false });
    const copy = await ui.duplicate(survey.id, name);
    expect(copy.id).not.toBe(original.id);
    expect(copy).toMatchObject({
      name: `${name} (copy)`,
      is_active: false,
      response_count: 0,
      description: original.description,
      response_target: original.response_target,
      requires_response_number: original.requires_response_number,
    });
    expect(structure(copy)).toEqual(structure(original));
    const originalIds = new Set(
      original.questions.flatMap((q) => [q.id, ...q.options.map((o) => o.id)]),
    );
    for (const id of copy.questions.flatMap((q) => [
      q.id,
      ...q.options.map((o) => o.id),
    ])) {
      expect(originalIds.has(id)).toBe(false);
    }
    await page.reload();
    await expect(
      page.getByPlaceholder(SURVEY_FORM.namePlaceholder, { exact: true }),
    ).toHaveValue(copy.name);
    const persistedCopy = await api.request("GET", SURVEY_ENDPOINT(copy.id));
    expect(persistedCopy.status()).toBe(200);
    expect(await persistedCopy.json()).toMatchObject(copy);
    const persistedOriginal = await api.request(
      "GET",
      SURVEY_ENDPOINT(original.id),
    );
    expect(persistedOriginal.status()).toBe(200);
    expect(await persistedOriginal.json()).toEqual(original);
  });
});

test.describe("analyst responses", () => {
  test.use({ role: "analyst" });

  test("reads owned FIES responses, opens a real detail and downloads matching XLSX row count", async ({
    page,
    flow,
  }) => {
    const { survey, total } = await flow.fiesWithResponses(3);
    const ui = new SurveysPage(page);
    const listing = await ui.responses(survey.id);
    expect(listing.total).toBe(total);
    expect(listing.items).toHaveLength(total);
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(
      total,
    );
    const first = listing.items[0];
    expect(first.survey.id).toBe(survey.id);
    expect(first.score_fies).not.toBeNull();
    const detailLoaded = waitForApi(
      page,
      "GET",
      SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT(survey.id, first.id),
    );
    await page.getByRole("table").locator("tbody tr").first().click();
    const detailResponse = await detailLoaded;
    expect(detailResponse.status()).toBe(200);
    const detail = (await detailResponse.json()) as SurveyResponseDetail;
    expect(detail).toMatchObject({ id: first.id, survey: { id: survey.id } });
    expect(detail.answers).toHaveLength(survey.questions.length);
    const detailTitle = survey.requires_response_number
      ? `${RESPONSES_PAGE.columns.responseNumber} ${detail.response_number} — ${detail.submitted_by.name}`
      : `${RESPONSES_PAGE.detailTitle} — ${detail.submitted_by.name}`;
    const dialog = page.getByRole("dialog", { name: detailTitle, exact: true });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(survey.questions[0].text, { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await assertDownload(page, {
      path: SURVEY_RESPONSES_EXPORT_ENDPOINT(survey.id),
      click: () =>
        page
          .getByRole("button", { name: RESPONSES_PAGE.export, exact: true })
          .click(),
      format: "xlsx",
      expectedRows: listing.total,
    });
  });
});
