import { randomUUID } from "node:crypto";
import {
  expect,
  type APIResponse,
  type BrowserContext,
  type TestInfo,
} from "@playwright/test";
import {
  CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
  REGISTER_FIELD_WORKER_ENDPOINT,
} from "../../constants/api";
import type { ApiMethod } from "../../lib/types";
import type {
  EstablishmentRequestCreationResponse,
  EstablishmentResponse,
} from "../../types/establishment";
import { e2eEnv } from "./env";
import { currentTokens } from "./session";

type OwnedWorker = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  password: string;
};

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

  async establishmentRequest(
    label = "request",
  ): Promise<
    Pick<
      EstablishmentRequestCreationResponse,
      "id" | "name" | "formatted_address"
    >
  > {
    const body = {
      name: this.name(label),
      formatted_address: this.name("declared-address"),
      city: "Ciudad Autónoma de Buenos Aires",
      province: "Ciudad Autónoma de Buenos Aires",
    };
    const created = await this.json<EstablishmentRequestCreationResponse>(
      "POST",
      CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
      201,
      body,
    );
    expect(created.status).toBe("pending");
    expect(created.name).toBe(body.name);
    return created;
  }

  async fieldWorker(establishmentIds: string[]): Promise<OwnedWorker> {
    const body = {
      email: `${this.name("worker", 60)}@example.com`.toLowerCase(),
      password: "Fictional-E2e-123!",
      name: this.name("Worker"),
      last_name: "E2E",
      establishments: establishmentIds,
    };
    const response = await this.adminContext.request.post(
      new URL(REGISTER_FIELD_WORKER_ENDPOINT, e2eEnv.apiURL).toString(),
      { data: body },
    );
    expect(response.status(), "public pending field-worker registration").toBe(
      201,
    );
    const created = (await response.json()) as Omit<OwnedWorker, "password"> & {
      role: string;
      status: string;
      establishments: string[];
    };
    expect(created.role).toBe("field_worker");
    expect(created.status).toBe("pending_validation");
    expect(created.email).toBe(body.email);
    expect([...created.establishments].sort()).toEqual(
      [...establishmentIds].sort(),
    );
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      last_name: created.last_name,
      password: body.password,
    };
  }
}
