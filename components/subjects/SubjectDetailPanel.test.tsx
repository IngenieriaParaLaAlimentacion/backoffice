import { act, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { SUBJECT_ENDPOINT } from "@/constants/api";
import { renderWithProviders } from "@/test-utils";
import SubjectDetailPanel from "./SubjectDetailPanel";

const subject = {
  id: "subject-1",
  dni: 42000001,
  name: "Ana",
  last_name: "García",
  sex: "female",
  birth_date: "2008-04-28",
  is_rural: false,
  is_indigenous: false,
  nutritional_status: null,
  latest_measurement: null,
};

afterEach(() => {
  vi.useRealTimers();
});

it("shows current demographic age and refreshes it on focus", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-28T02:59:00Z"));
  server.use(
    http.get(SUBJECT_ENDPOINT(":subjectId"), () => HttpResponse.json(subject)),
  );
  await renderWithProviders(
    <SubjectDetailPanel subjectId="subject-1" onClose={() => {}} />,
  );
  const dialog = await screen.findByRole("dialog");
  const ageField = await within(dialog).findByText("Edad");
  expect(ageField.parentElement).toHaveTextContent("18 a 5 m");
  expect(within(dialog).getByText("28/04/2008")).toBeInTheDocument();
  vi.setSystemTime(new Date("2026-10-28T03:01:00Z"));
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
  expect(ageField.parentElement).toHaveTextContent("18 a 6 m");
});

const scopedMeasurement = {
  id: "local-measurement",
  measured_at: "2026-09-25T15:30:00Z",
  weight_kg: 32,
  height_cm: 145,
  bmi: 15.22,
  alerts: [],
  assessments: [
    {
      indicator: "height_for_age",
      status: "evaluated",
      classification: "short_stature",
      z_score: -2.5,
      reference_version: "synthetic-test",
      alert: { severity: "high", detail: "Scoped reading" },
    },
  ],
} satisfies import("@/types/establishment").EstablishmentLatestMeasurement;

it("keeps current age and scoped assessments when opened from an establishment", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-28T13:00:00Z"));
  server.use(
    http.get(SUBJECT_ENDPOINT(":subjectId"), () =>
      HttpResponse.json({
        ...subject,
        latest_measurement: {
          ...scopedMeasurement,
          measured_at: "2026-10-27T18:00:00Z",
          weight_kg: 52,
          alerts: [],
          establishment: {
            id: "other",
            name: "Otro comedor",
            city: "La Plata",
            province: "Buenos Aires",
          },
        },
      }),
    ),
  );
  await renderWithProviders(
    <SubjectDetailPanel
      subjectId="subject-1"
      onClose={() => {}}
      scopedMeasurement={scopedMeasurement}
      measurementScopeLabel="Último relevamiento en este comedor"
    />,
  );
  const dialog = await screen.findByRole("dialog");
  const ageField = await within(dialog).findByText("Edad");
  expect(ageField.parentElement).toHaveTextContent("18 a 6 m");
  expect(
    within(dialog).getByText("Último relevamiento en este comedor"),
  ).toBeInTheDocument();
  expect(within(dialog).getByText("Talla baja")).toBeInTheDocument();
  expect(within(dialog).getByText("25/09/2026")).toBeInTheDocument();
  expect(within(dialog).getByText("32 kg")).toBeInTheDocument();
  expect(within(dialog).queryByText("52 kg")).not.toBeInTheDocument();
  expect(within(dialog).queryByText("Otro comedor")).not.toBeInTheDocument();
});
