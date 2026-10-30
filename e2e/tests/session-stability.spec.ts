import { test, expect } from "../fixtures";
import { ME_ENDPOINT, REFRESH_ENDPOINT } from "../../constants/api";
import { DEVICE_ID_STORAGE_KEY } from "../../constants/tokenStorage";
import { SurveyListPage } from "../pages/survey-list.page";
import { currentTokens } from "../support/session";
import { e2eEnv } from "../support/env";

test.use({ role: e2eEnv.stressRole });

for (let index = 1; index <= 10; index += 1) {
  test(`same-role session ${index} @session-stress`, async ({
    page,
    context,
    api,
    sessionProof,
  }, info) => {
    const firstRead = await api.request("GET", ME_ENDPOINT);
    expect(firstRead.status()).toBe(200);
    expect((await firstRead.json()).role).toBe(e2eEnv.stressRole);
    const survey = await api.survey(`session-${index}`);
    const list = new SurveyListPage(page);
    await list.open();
    await list.search(survey.name);
    const beforeReload = await currentTokens(context);
    const deviceId = await page.evaluate(
      (key) => localStorage.getItem(key),
      DEVICE_ID_STORAGE_KEY,
    );
    await list.open(true);
    await list.search(survey.name);
    expect(
      (await currentTokens(context)).refreshToken !== beforeReload.refreshToken,
    ).toBe(true);
    const secondRead = await api.request("GET", ME_ENDPOINT);
    expect(secondRead.status()).toBe(200);
    expect((await secondRead.json()).role).toBe(e2eEnv.stressRole);
    const replay = await api.request("POST", REFRESH_ENDPOINT, {
      refresh_token: beforeReload.refreshToken,
      device_id: deviceId,
    });
    expect(replay.status()).toBe(401);
    const proof = await sessionProof();
    expect(proof.role).toBe(e2eEnv.stressRole);
    expect(proof.loginCount).toBe(1);
    expect(proof.refreshCount).toBeGreaterThanOrEqual(3);
    expect(proof.successfulProtectedReads).toBeGreaterThanOrEqual(2);
    await info.attach("session-proof", {
      body: Buffer.from(JSON.stringify(proof)),
      contentType: "application/json",
    });
  });
}
