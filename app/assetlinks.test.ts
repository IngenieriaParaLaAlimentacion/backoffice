import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Statement = {
  relation: string[];
  target: {
    namespace: string;
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
};

const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

// Read from disk rather than imported: this is the exact file the server sends.
const statements: Statement[] = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "public/.well-known/assetlinks.json"),
    "utf8",
  ),
);

describe("assetlinks.json", () => {
  // Android gives no error when verification fails: the link just opens the
  // browser. A wrong package or fingerprint here is otherwise invisible.
  it("declares both Android packages", () => {
    expect(statements.map((s) => s.target.package_name).sort()).toEqual([
      "ar.com.ingenieriaalimentacion",
      "ar.com.ingenieriaalimentacion.tst",
    ]);
  });

  it.each(statements)(
    "grants $target.package_name the handle_all_urls relation with real fingerprints",
    ({ relation, target }) => {
      expect(relation).toEqual(["delegate_permission/common.handle_all_urls"]);
      expect(target.namespace).toBe("android_app");
      expect(target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
      for (const fingerprint of target.sha256_cert_fingerprints) {
        expect(fingerprint).toMatch(FINGERPRINT);
      }
    },
  );
});
