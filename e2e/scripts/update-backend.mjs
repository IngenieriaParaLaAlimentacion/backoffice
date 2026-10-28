import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import process from "node:process";

const [commit, ...extra] = process.argv.slice(2);
assert(
  extra.length === 0 && /^[0-9a-f]{40}$/.test(commit ?? ""),
  "Usage: node e2e/scripts/update-backend.mjs <full-40-character-backend-commit-sha>",
);
const repository = "IngenieriaParaLaAlimentacion/backend";
const image = `ghcr.io/ingenieriaparalaalimentacion/backend:sha-${commit}`;
execFileSync("docker", ["manifest", "inspect", image], {
  stdio: "ignore",
  timeout: 30_000,
  killSignal: "SIGKILL",
});
const files = Object.fromEntries(
  await Promise.all(
    ["e2e/compose.yml", "e2e/.env.e2e"].map(async (relative) => {
      const response = await fetch(
        `https://raw.githubusercontent.com/${repository}/${commit}/${relative}`,
        { signal: AbortSignal.timeout(30_000) },
      );
      assert(response.ok, `Cannot retrieve ${relative} (${response.status})`);
      const content = Buffer.from(await response.arrayBuffer());
      return [relative, createHash("sha256").update(content).digest("hex")];
    }),
  ),
);
await fs.writeFile(
  new URL("../backend.json", import.meta.url),
  `${JSON.stringify({ repository, commit, image, files }, null, 2)}\n`,
);
console.log(
  "Updated e2e/backend.json; review the source changes and run npm run e2e:ci.",
);
