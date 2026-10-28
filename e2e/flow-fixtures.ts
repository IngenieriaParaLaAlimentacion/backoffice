import { test as base, expect } from "./fixtures";
import { FlowData } from "./support/flow-data";
import { expectLoaded } from "./support/ui";
import { e2eEnv } from "./support/env";
import { saveCheckpoint, RefreshTracker } from "./support/session";

export const test = base.extend<{ flow: FlowData }>({
  flow: async (
    { context, page, role, browser, workerSessions },
    provide,
    info,
  ) => {
    // Depend on page so the scenario's real application auth has settled first.
    await expectLoaded(page);
    if (role === "admin") {
      await provide(new FlowData(context, info));
      return;
    }
    const session = await workerSessions.get("admin");
    const adminContext = await browser.newContext({
      baseURL: e2eEnv.baseURL,
      storageState: session.state,
    });
    const tracker = new RefreshTracker(adminContext);
    try {
      const adminPage = await adminContext.newPage();
      await adminPage.goto("/dashboard");
      await expectLoaded(adminPage);
      await provide(new FlowData(adminContext, info));
      if (info.status === "passed") {
        await saveCheckpoint(tracker, session);
      }
    } finally {
      tracker.dispose();
      await adminContext.close();
    }
  },
});

export { expect };
