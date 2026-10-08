// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

// Next reports the request headers a proxy sets as response headers: one lists
// their names and `x-middleware-request-<name>` carries each value.
function headersSentToBackend(response: Response) {
  const names =
    response.headers.get("x-middleware-override-headers")?.split(",") ?? [];
  return Object.fromEntries(
    names.map((name) => [
      name,
      response.headers.get(`x-middleware-request-${name}`),
    ]),
  );
}

function call(headers: Record<string, string>) {
  const request = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers,
  });
  return headersSentToBackend(proxy(request));
}

describe("proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends the service token and the address the edge proxy reported", () => {
    vi.stubEnv("INTERNAL_SERVICE_TOKEN", "s3cret");

    expect(call({ "x-real-ip": "200.1.1.1" })).toMatchObject({
      "x-internal-token": "s3cret",
      "x-client-ip": "200.1.1.1",
    });
  });

  it("replaces the token and the address the browser sends", () => {
    vi.stubEnv("INTERNAL_SERVICE_TOKEN", "s3cret");

    expect(
      call({
        "x-real-ip": "200.1.1.1",
        "x-internal-token": "forged",
        "x-client-ip": "6.6.6.6",
      }),
    ).toMatchObject({
      "x-internal-token": "s3cret",
      "x-client-ip": "200.1.1.1",
    });
  });

  it("sends neither header when no token is configured, whatever the browser sends", () => {
    vi.stubEnv("INTERNAL_SERVICE_TOKEN", "");

    const sent = call({
      "x-real-ip": "200.1.1.1",
      "x-internal-token": "forged",
      "x-client-ip": "6.6.6.6",
    });

    expect(sent).not.toHaveProperty("x-internal-token");
    expect(sent).not.toHaveProperty("x-client-ip");
  });

  it("sends the token without an address when the edge proxy reported none", () => {
    vi.stubEnv("INTERNAL_SERVICE_TOKEN", "s3cret");

    const sent = call({ "x-client-ip": "6.6.6.6" });

    expect(sent).toMatchObject({ "x-internal-token": "s3cret" });
    expect(sent).not.toHaveProperty("x-client-ip");
  });

  it("reads the address from the header named by CLIENT_IP_HEADER", () => {
    vi.stubEnv("INTERNAL_SERVICE_TOKEN", "s3cret");
    vi.stubEnv("CLIENT_IP_HEADER", "cf-connecting-ip");

    expect(
      call({ "cf-connecting-ip": "200.1.1.1", "x-real-ip": "9.9.9.9" }),
    ).toMatchObject({ "x-client-ip": "200.1.1.1" });
  });
});
