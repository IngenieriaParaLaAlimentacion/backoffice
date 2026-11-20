import { describe, expect, it, vi } from "vitest";
import {
  blockUserAction,
  listUsersAction,
  unblockUserAction,
} from "./admin.service";
import {
  BLOCK_USER_ENDPOINT,
  LIST_USERS_ENDPOINT,
  UNBLOCK_USER_ENDPOINT,
} from "@/constants/api";
import { AuthDispatcher } from "@/context/AuthContext";
import { ApiError, ERROR_TYPES } from "@/lib/apiError";
import { DEFAULT_USER_DETAIL } from "@/mocks/fixtures/admin";

const dispatcherAnswering = (response: object) =>
  vi.fn().mockResolvedValue(response);

describe("listUsersAction", () => {
  it.each([
    [["active", "blocked"], "?status=active&status=blocked"],
    ["blocked", "?status=blocked"],
    [undefined, ""],
  ])("sends status %j as %j", async (status, query) => {
    const dispatcher = dispatcherAnswering({ ok: true, data: { items: [] } });

    await listUsersAction(dispatcher as unknown as AuthDispatcher, { status });

    expect(dispatcher).toHaveBeenCalledWith(`${LIST_USERS_ENDPOINT}${query}`);
  });
});

describe.each([
  ["blockUserAction", blockUserAction, BLOCK_USER_ENDPOINT],
  ["unblockUserAction", unblockUserAction, UNBLOCK_USER_ENDPOINT],
])("%s", (_name, action, endpoint) => {
  it("patches the user's endpoint and returns the updated user", async () => {
    const dispatcher = dispatcherAnswering({
      ok: true,
      data: DEFAULT_USER_DETAIL,
    });

    const user = await action(
      dispatcher as unknown as AuthDispatcher,
      DEFAULT_USER_DETAIL.id,
    );

    expect(user).toEqual(DEFAULT_USER_DETAIL);
    expect(dispatcher).toHaveBeenCalledWith(endpoint(DEFAULT_USER_DETAIL.id), {
      method: "PATCH",
    });
  });

  it("rejects with the backend's error type", async () => {
    const dispatcher = dispatcherAnswering({
      ok: false,
      status: 403,
      data: { type: ERROR_TYPES.ROLE_NOT_ALLOWED, detail: "no" },
    });

    await expect(
      action(dispatcher as unknown as AuthDispatcher, DEFAULT_USER_DETAIL.id),
    ).rejects.toMatchObject({
      status: 403,
      type: ERROR_TYPES.ROLE_NOT_ALLOWED,
    } satisfies Partial<ApiError>);
  });
});
