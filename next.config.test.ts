import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config redirects", () => {
  // The establishment-creation requests moved out of Establecimientos; old
  // bookmarks and links must land on the new tab.
  it("sends the old establishment requests route to its tab in Solicitudes", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];

    expect(redirects).toContainEqual({
      source: "/dashboard/establishments/requests",
      destination: "/dashboard/requests/establishment-creations",
      permanent: true,
    });
  });
});
