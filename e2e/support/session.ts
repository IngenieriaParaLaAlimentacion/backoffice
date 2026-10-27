import { randomUUID } from "node:crypto";
import {
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Request,
  type Response,
} from "@playwright/test";
import {
  ADMIN_LOGIN_ENDPOINT,
  ME_ENDPOINT,
  REFRESH_ENDPOINT,
} from "../../constants/api";
import {
  DEVICE_ID_STORAGE_KEY,
  TOKENS_STORAGE_KEY,
} from "../../constants/tokenStorage";
import type { AuthTokens } from "../../types/auth";
import type { RefreshTokenResponse } from "../../lib/types";
import type { ProfileResponse } from "../../types/user";
import { e2eEnv, type TestRole } from "./env";

export type BrowserState = Awaited<ReturnType<BrowserContext["storageState"]>>;
export type WorkerSession = {
  state: BrowserState;
  deviceId: string;
  loginCount: number;
};

export function makeStorageState(
  tokens: AuthTokens,
  deviceId: string,
): BrowserState {
  return {
    cookies: [],
    origins: [
      {
        origin: e2eEnv.baseURL,
        localStorage: [
          { name: TOKENS_STORAGE_KEY, value: JSON.stringify(tokens) },
          { name: DEVICE_ID_STORAGE_KEY, value: deviceId },
        ],
      },
    ],
  };
}

export function readTokens(state: BrowserState): AuthTokens | null {
  const entry = state.origins
    .find((o) => o.origin === e2eEnv.baseURL)
    ?.localStorage.find((item) => item.name === TOKENS_STORAGE_KEY);
  if (!entry) return null;
  const value: AuthTokens = JSON.parse(entry.value);
  if (
    typeof value.accessToken !== "string" ||
    typeof value.refreshToken !== "string"
  ) {
    throw new Error("Invalid persisted E2E token shape");
  }
  return value;
}

export function readDeviceId(state: BrowserState): string | undefined {
  return state.origins
    .find((o) => o.origin === e2eEnv.baseURL)
    ?.localStorage.find((item) => item.name === DEVICE_ID_STORAGE_KEY)?.value;
}

export async function currentTokens(
  context: BrowserContext,
): Promise<AuthTokens> {
  const tokens = readTokens(await context.storageState());
  if (!tokens) throw new Error("Expected a live authenticated browser session");
  return tokens;
}

export class WorkerSessions {
  private readonly sessions = new Map<TestRole, Promise<WorkerSession>>();
  private readonly loginCounts = new Map<TestRole, number>();

  constructor(private readonly request: APIRequestContext) {}

  get(role: TestRole): Promise<WorkerSession> {
    let value = this.sessions.get(role);
    if (!value) {
      value = this.login(role);
      this.sessions.set(role, value);
    }
    return value;
  }

  private async login(role: TestRole): Promise<WorkerSession> {
    const count = (this.loginCounts.get(role) ?? 0) + 1;
    this.loginCounts.set(role, count);
    expect(count, "one fixture login per worker and role").toBe(1);
    const deviceId = randomUUID();
    const response = await this.request.post(ADMIN_LOGIN_ENDPOINT, {
      data: { ...e2eEnv.credentials(role), device_id: deviceId },
    });
    expect(response.status(), `fixture login for ${role}`).toBe(200);
    const body = (await response.json()) as RefreshTokenResponse;
    if (
      typeof body.access_token !== "string" ||
      typeof body.refresh_token !== "string"
    ) {
      throw new Error("Fixture login did not return both token strings");
    }
    const profileResponse = await this.request.get(ME_ENDPOINT, {
      headers: { Authorization: `Bearer ${body.access_token}` },
    });
    expect(profileResponse.status()).toBe(200);
    const profile = (await profileResponse.json()) as ProfileResponse;
    expect(
      profile.role,
      "configured account must have the exact test role",
    ).toBe(role);
    return {
      state: makeStorageState(
        {
          accessToken: body.access_token,
          refreshToken: body.refresh_token,
          tokenType: body.token_type,
        },
        deviceId,
      ),
      deviceId,
      loginCount: count,
    };
  }
}

function isRefresh(request: Request): boolean {
  return (
    request.method() === "POST" &&
    new URL(request.url()).pathname === REFRESH_ENDPOINT
  );
}

export class RefreshTracker {
  private readonly inFlight = new Set<Request>();
  private readonly reads = new Set<Promise<void>>();
  private failed = false;
  private latest: RefreshTokenResponse | undefined;
  refreshCount = 0;

  constructor(private readonly context: BrowserContext) {
    context.on("request", this.onRequest);
    context.on("requestfinished", this.onFinished);
    context.on("requestfailed", this.onFailed);
    context.on("response", this.onResponse);
  }

  private readonly onRequest = (request: Request): void => {
    if (isRefresh(request)) this.inFlight.add(request);
  };
  private readonly onFinished = (request: Request): void => {
    this.inFlight.delete(request);
  };
  private readonly onFailed = (request: Request): void => {
    if (isRefresh(request)) this.failed = true;
    this.inFlight.delete(request);
  };
  private readonly onResponse = (response: Response): void => {
    if (!isRefresh(response.request())) return;
    if (response.status() !== 200) {
      this.failed = true;
      return;
    }
    const read: Promise<void> = response
      .json()
      .then((value: RefreshTokenResponse) => {
        if (
          typeof value.refresh_token !== "string" ||
          typeof value.access_token !== "string"
        ) {
          this.failed = true;
          return;
        }
        this.latest = value;
        this.refreshCount += 1;
      })
      .catch(() => {
        this.failed = true;
      })
      .finally(() => {
        this.reads.delete(read);
      });
    this.reads.add(read);
  };

  async checkpoint(): Promise<BrowserState> {
    let accepted: BrowserState | undefined;
    await expect
      .poll(
        async () => {
          await Promise.all(this.reads);
          if (this.failed)
            throw new Error(
              "A worker session refresh failed; inspect the trace",
            );
          const version = this.refreshCount;
          const state = await this.context.storageState();
          const tokens = readTokens(state);
          const matches =
            tokens !== null &&
            (!this.latest || tokens.refreshToken === this.latest.refresh_token);
          if (
            matches &&
            version === this.refreshCount &&
            this.inFlight.size === 0 &&
            this.reads.size === 0
          ) {
            accepted = state;
            return true;
          }
          return false;
        },
        {
          timeout: 10_000,
          message: "persist the latest real refresh response before handoff",
        },
      )
      .toBe(true);
    if (!accepted) throw new Error("Could not checkpoint the worker session");
    return accepted;
  }

  dispose(): void {
    this.context.off("request", this.onRequest);
    this.context.off("requestfinished", this.onFinished);
    this.context.off("requestfailed", this.onFailed);
    this.context.off("response", this.onResponse);
  }
}
