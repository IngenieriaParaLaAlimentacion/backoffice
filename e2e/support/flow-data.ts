import { randomUUID } from "node:crypto";
import {
  expect,
  type APIResponse,
  type BrowserContext,
  type TestInfo,
} from "@playwright/test";
import { ESTABLISHMENTS_ENDPOINT } from "../../constants/api";
import type { ApiMethod } from "../../lib/types";
import type { EstablishmentResponse } from "../../types/establishment";
import { e2eEnv } from "./env";
import { currentTokens } from "./session";

export class FlowData {
  private readonly prefix: string;

  constructor(
    private readonly adminContext: BrowserContext,
    info: TestInfo,
  ) {
    const run =
      (process.env.E2E_RUN_ID ?? "local")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .slice(0, 12) || "local";
    this.prefix = `e2e-${run}-w${info.workerIndex}-r${info.retry}`;
  }

  name(label: string, limit = 100): string {
    if (!Number.isInteger(limit) || limit < 40) {
      throw new Error(
        "Unique fixture names require an integer limit of at least 40",
      );
    }
    const suffix = randomUUID().replaceAll("-", "");
    const head = `${this.prefix}-${label.replace(/[^a-zA-Z0-9-]/g, "-")}`;
    return `${head.slice(0, limit - suffix.length - 1)}-${suffix}`;
  }

  private async request(
    method: ApiMethod,
    path: string,
    data?: object,
  ): Promise<APIResponse> {
    const tokens = await currentTokens(this.adminContext);
    return this.adminContext.request.fetch(
      new URL(path, e2eEnv.apiURL).toString(),
      {
        method,
        data,
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      },
    );
  }

  private async json<T>(
    method: ApiMethod,
    path: string,
    status: number,
    data?: object,
  ): Promise<T> {
    const response = await this.request(method, path, data);
    expect(response.status(), `fixture ${method} ${path}`).toBe(status);
    return (await response.json()) as T;
  }

  async establishment(label = "establishment"): Promise<EstablishmentResponse> {
    const name = this.name(label);
    const body = {
      name,
      formatted_address: this.name("fictional-address"),
      place_id: this.name("place"),
      latitude: -34.6037,
      longitude: -58.3816,
      city: this.name("city"),
      province: "Ciudad Autónoma de Buenos Aires",
    };
    const created = await this.json<EstablishmentResponse>(
      "POST",
      ESTABLISHMENTS_ENDPOINT,
      201,
      body,
    );
    expect(created.name).toBe(name);
    expect(created.place_id).toBe(body.place_id);
    expect(created.id).toBeTruthy();
    return created;
  }
}
