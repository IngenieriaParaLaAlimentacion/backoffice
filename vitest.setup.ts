import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";
import { clearSwrCache } from "./lib/swr";
import { resetMovementFixture } from "./mocks/fixtures/establishment";
import { resetNutritionReportFixture } from "./mocks/fixtures/nutritionReport";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(async () => {
  server.resetHandlers();
  resetMovementFixture();
  resetNutritionReportFixture();
  // SWR's cache outlives a test and would hand the next one its responses.
  await clearSwrCache();
  // What `mockBlobDownload` stubbed: jsdom has neither static, so deleting is the reset.
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
  vi.restoreAllMocks();
});
afterAll(() => server.close());
