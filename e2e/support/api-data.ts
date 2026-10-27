import { randomUUID } from "node:crypto";
import type { APIResponse, BrowserContext, TestInfo } from "@playwright/test";
import { ME_ENDPOINT, SURVEYS_ENDPOINT } from "../../constants/api";
import type { ApiMethod } from "../../lib/types";
import type { SurveyCreateRequest, SurveyResponse } from "../../types/survey";
import { e2eEnv } from "./env";
import { currentTokens } from "./session";

export class TestData {
  successfulProtectedReads = 0;
  private readonly prefix: string;

  constructor(
    private readonly context: BrowserContext,
    info: TestInfo,
  ) {
    const run = (process.env.E2E_RUN_ID ?? "local")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .slice(0, 16);
    this.prefix = `e2e-${run}-w${info.workerIndex}-r${info.retry}-${randomUUID()}`;
  }

  async request(
    method: ApiMethod,
    path: string,
    data?: object,
  ): Promise<APIResponse> {
    const tokens = await currentTokens(this.context);
    const response = await this.context.request.fetch(
      new URL(path, e2eEnv.apiURL).toString(),
      {
        method,
        data,
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      },
    );
    if (method === "GET" && path === ME_ENDPOINT && response.status() === 200) {
      this.successfulProtectedReads += 1;
    }
    return response;
  }

  async survey(label = "permission"): Promise<SurveyResponse> {
    const body: SurveyCreateRequest = {
      name: `${this.prefix}-${label}`.slice(0, 120),
      description: "Owned by one E2E test; fictional data",
      response_target: "anonymous",
      requires_response_number: false,
      questions: [
        {
          text: "E2E permission fixture",
          response_type: "text",
          is_required: false,
        },
      ],
    };
    const response = await this.request("POST", SURVEYS_ENDPOINT, body);
    if (response.status() !== 201) {
      throw new Error(
        `Private survey setup failed with HTTP ${response.status()}`,
      );
    }
    const survey = (await response.json()) as SurveyResponse;
    if (survey.name !== body.name || typeof survey.id !== "string") {
      throw new Error("Private survey setup returned an unexpected identity");
    }
    return survey;
  }
}
