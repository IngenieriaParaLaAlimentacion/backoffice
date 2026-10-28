import { matchesApiRequest } from "../support/api";
import { test, expect } from "../flow-fixtures";
import { SubjectsMeasurementsPage } from "../pages/subjects-measurements.page";
import { assertDownload } from "../support/download";
import { SUBJECTS_EXPORT_ENDPOINT } from "../../constants/api";
import { EXPORT } from "../../constants/exports";
import { SUBJECTS_PAGE, SUBJECT_DETAIL_PANEL } from "../../constants/subjects";
import { MEASUREMENTS_PAGE } from "../../constants/measurements";
import {
  ageInMonths,
  argentineToday,
  formatAgeMonths,
  formatTimeSinceMeasurement,
  formatTimestampDate,
} from "../../lib/format";

test.describe("subjects and measurements", () => {
  test.use({ role: "analyst" });

  test("birth bounds are inclusive and CSV exports all matching pages", async ({
    page,
    flow,
  }) => {
    test.setTimeout(90_000);
    const prefix = flow.name("birth-range", 65);
    const from = "2000-01-01";
    const to = "2000-12-31";
    const subjects: Awaited<ReturnType<typeof flow.subject>>[] = [];
    for (let index = 0; index < 22; index += 1) {
      subjects.push(
        await flow.subject({
          name: `${prefix}-${String(index).padStart(2, "0")}`,
          lastName: "Fictitious",
          birthDate: index % 2 === 0 ? from : to,
        }),
      );
    }
    const outside = await flow.subject({
      name: `${prefix}-outside`,
      lastName: "Fictitious",
      birthDate: "1999-12-31",
    });
    const outsideAfter = await flow.subject({
      name: `${prefix}-outside-after`,
      lastName: "Fictitious",
      birthDate: "2001-01-01",
    });
    const clinical = new SubjectsMeasurementsPage(page);
    await clinical.subjects();
    const first = await clinical.filterSubjects(prefix, from, to);
    expect(first.total).toBe(22);
    expect(first.total_pages).toBe(2);
    expect(first.items).toHaveLength(20);
    await expect(clinical.rows).toHaveCount(20);
    const second = await clinical.nextSubjectsPage(prefix, from, to);
    expect(second.total).toBe(22);
    expect(second.items).toHaveLength(2);
    await expect(clinical.rows).toHaveCount(2);
    const seen = [...first.items, ...second.items];
    expect(seen.map((subject) => subject.id).sort()).toEqual(
      subjects.map((subject) => subject.id).sort(),
    );
    expect(seen.map((subject) => subject.id)).not.toContain(outside.id);
    expect(seen.map((subject) => subject.id)).not.toContain(outsideAfter.id);
    expect(new Set(seen.map((subject) => subject.birth_date))).toEqual(
      new Set([from, to]),
    );
    for (const subject of second.items) {
      await expect(
        clinical.rows.filter({ hasText: String(subject.dni) }),
      ).toHaveCount(1);
    }
    const exported = page.waitForRequest((request) =>
      matchesApiRequest(request, "GET", SUBJECTS_EXPORT_ENDPOINT),
    );
    const csvResponse = page.waitForResponse((response) =>
      matchesApiRequest(response.request(), "GET", SUBJECTS_EXPORT_ENDPOINT),
    );
    await assertDownload(page, {
      path: SUBJECTS_EXPORT_ENDPOINT,
      click: () =>
        page.getByRole("button", { name: EXPORT.label, exact: true }).click(),
      format: "csv",
      expectedRows: subjects.length,
    });
    const exportResponse = await csvResponse;
    const csv = (await exportResponse.text()).replace(/^\uFEFF/, "");
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[0]).toBe(
      "Nombre;Documento;Fecha de nacimiento;Edad;Último relevamiento;Tiempo desde el último relevamiento",
    );
    const filename = exportResponse.headers()["content-disposition"];
    const exportDay = /sujetos_(\d{4}-\d{2}-\d{2})\.csv/.exec(filename)?.[1];
    expect(exportDay).toBeTruthy();
    const rows = lines.slice(1).map((line) => line.split(";"));
    for (const subject of subjects) {
      const cells = rows.find((row) => row[1] === String(subject.dni));
      expect(cells).toBeDefined();
      expect(cells?.[3]).toBe(
        formatAgeMonths(ageInMonths(subject.birth_date, exportDay!)),
      );
      expect(cells?.[4]).toBe("");
      expect(cells?.[5]).toBe("—");
    }
    const query = new URL((await exported).url()).searchParams;
    expect(query.get("search")).toBe(prefix);
    expect(query.get("birth_date_from")).toBe(from);
    expect(query.get("birth_date_to")).toBe(to);
    expect(query.has("page")).toBe(false);
    expect(query.has("page_size")).toBe(false);
    expect(query.get("sort_order")).toBe("name_asc");
  });

  test("measurement row opens the persisted three-point subject evolution", async ({
    page,
    flow,
  }) => {
    const establishment = await flow.establishment("evolution");
    const subject = await flow.subject({ birthDate: "1990-01-01" });
    const readings = [
      { measuredAt: "2024-03-01T15:00:00.000Z", weightKg: 64, heightCm: 170 },
      { measuredAt: "2024-06-01T15:00:00.000Z", weightKg: 66, heightCm: 171 },
      { measuredAt: "2024-09-01T15:00:00.000Z", weightKg: 68, heightCm: 172 },
    ];
    const measurements: Awaited<ReturnType<typeof flow.measurement>>[] = [];
    for (const reading of readings)
      measurements.push(
        await flow.measurement({
          subjectId: subject.id,
          establishmentId: establishment.id,
          ...reading,
        }),
      );
    const clinical = new SubjectsMeasurementsPage(page);
    const verify = async (reload = false) => {
      const listing = await clinical.measurements(
        establishment.city,
        establishment.province,
        "2024-01-01",
        "2024-12-31",
        reload,
      );
      expect(listing.total).toBe(3);
      expect(listing.items.map((measurement) => measurement.id).sort()).toEqual(
        measurements.map((measurement) => measurement.id).sort(),
      );
      expect(
        listing.items.every(
          (measurement) =>
            measurement.subject.id === subject.id &&
            measurement.establishment.id === establishment.id,
        ),
      ).toBe(true);
      await expect(clinical.rows).toHaveCount(3);
      const evolution = await clinical.evolution(subject);
      expect(evolution.subject).toMatchObject({
        id: subject.id,
        dni: subject.dni,
        name: subject.name,
        last_name: subject.last_name,
      });
      const now = new Date(await page.evaluate(() => new Date().toISOString()));
      const expectedAge = formatAgeMonths(
        ageInMonths(subject.birth_date, argentineToday(now)),
      );
      const dialog = page.getByRole("dialog", {
        name: `${subject.name} ${subject.last_name}`,
        exact: true,
      });
      await expect(
        dialog
          .getByText(MEASUREMENTS_PAGE.detail.age, { exact: true })
          .locator(".."),
      ).toContainText(expectedAge);
      expect(evolution.points).toHaveLength(3);
      expect(
        evolution.points.map((point) => ({
          measuredAt: new Date(point.measured_at).toISOString(),
          weightKg: point.weight_kg,
          heightCm: point.height_cm,
        })),
      ).toEqual(readings);
    };
    await verify();
    await verify(true);

    await clinical.subjects();
    await clinical.filterSubjects(
      subject.name,
      subject.birth_date,
      subject.birth_date,
    );
    const now = new Date(await page.evaluate(() => new Date().toISOString()));
    const expectedAge = formatAgeMonths(
      ageInMonths(subject.birth_date, argentineToday(now)),
    );
    const latest = readings[readings.length - 1].measuredAt;
    const expectedElapsed = formatTimeSinceMeasurement(latest, now);
    const row = clinical.rows.filter({ hasText: String(subject.dni) });
    await expect(row).toContainText(expectedAge);
    await expect(row).toContainText(formatTimestampDate(latest));
    await expect(row).toContainText(expectedElapsed);

    await page.setViewportSize({ width: 390, height: 844 });
    const card = page
      .getByRole("button")
      .filter({ hasText: `${subject.name} ${subject.last_name}` })
      .filter({ hasText: String(subject.dni) });
    await expect(card).toBeVisible();
    await expect(card).toContainText(
      `${SUBJECTS_PAGE.columns.age}: ${expectedAge}`,
    );
    await expect(card).toContainText(expectedElapsed);
    await card.click();
    const detail = page.getByRole("dialog");
    await expect(
      detail
        .getByText(SUBJECT_DETAIL_PANEL.fields.age, { exact: true })
        .locator(".."),
    ).toContainText(expectedAge);
  });
});
