import { test as base, expect, type BrowserContext } from "@playwright/test";
import { e2eEnv, type TestRole } from "./support/env";
import { TestData } from "./support/api-data";
import {
  readDeviceId,
  RefreshTracker,
  WorkerSessions,
} from "./support/session";

export type SessionProof = {
  workerIndex: number;
  parallelIndex: number;
  role: TestRole;
  loginCount: number;
  refreshCount: number;
  successfulProtectedReads: number;
};

type TestFixtures = {
  role: TestRole;
  api: TestData;
  sessionProof: () => Promise<SessionProof>;
};
type WorkerFixtures = { workerSessions: WorkerSessions };
const trackers = new WeakMap<BrowserContext, RefreshTracker>();

export const test = base.extend<TestFixtures, WorkerFixtures>({
  role: ["admin", { option: true }],
  workerSessions: [
    async ({ playwright }, provide) => {
      const request = await playwright.request.newContext({
        baseURL: e2eEnv.apiURL,
      });
      try {
        await provide(new WorkerSessions(request));
      } finally {
        await request.dispose();
      }
    },
    { scope: "worker" },
  ],
  storageState: async ({ workerSessions, role }, provide) => {
    await provide((await workerSessions.get(role)).state);
  },
  context: async ({ context, workerSessions, role }, provide, info) => {
    const session = await workerSessions.get(role);
    const tracker = new RefreshTracker(context);
    trackers.set(context, tracker);
    try {
      await provide(context);
    } finally {
      try {
        if (info.status === "passed") {
          const state = await tracker.checkpoint();
          expect(
            readDeviceId(state) === session.deviceId,
            "worker device identity is retained",
          ).toBe(true);
          session.state = state;
        }
      } finally {
        tracker.dispose();
        trackers.delete(context);
      }
    }
  },
  page: async ({ page }, provide) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "¡Bienvenido!", exact: true }),
    ).toBeVisible();
    await provide(page);
  },
  api: async ({ context }, provide, info) => {
    await provide(new TestData(context, info));
  },
  sessionProof: async (
    { context, workerSessions, role, api },
    provide,
    info,
  ) => {
    await provide(async () => {
      const tracker = trackers.get(context);
      if (!tracker) throw new Error("Missing refresh tracker");
      await tracker.checkpoint();
      return {
        workerIndex: info.workerIndex,
        parallelIndex: info.parallelIndex,
        role,
        loginCount: (await workerSessions.get(role)).loginCount,
        refreshCount: tracker.refreshCount,
        successfulProtectedReads: api.successfulProtectedReads,
      };
    });
  },
});

export { expect };
