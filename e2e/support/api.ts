import type { Page, Request, Response } from "@playwright/test";
import type { ApiMethod } from "../../lib/types";

export function matchesApiRequest(
  request: Request,
  method: ApiMethod,
  path: string,
): boolean {
  return (
    request.method() === method && new URL(request.url()).pathname === path
  );
}

export function waitForApi(
  page: Page,
  method: ApiMethod,
  path: string,
): Promise<Response> {
  return page.waitForResponse((response) =>
    matchesApiRequest(response.request(), method, path),
  );
}
