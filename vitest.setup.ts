import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";
import { clearSwrCache } from "./lib/swr";
import { resetMovementFixture } from "./mocks/fixtures/establishment";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(async () => {
  server.resetHandlers();
  resetMovementFixture();
  // SWR's cache outlives a test and would hand the next one its responses.
  await clearSwrCache();
});
afterAll(() => server.close());
