import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { e2eEnv } from "./e2e/support/env";

const mode = process.env.E2E_MODE ?? "baseline";
const isStress = mode === "stress";
const isQuarantine = mode === "quarantine";
const isCI = Boolean(process.env.CI);
let grep: RegExp | undefined;
let grepInvert: RegExp | undefined = /@quarantine|@session-stress/;
if (isStress) {
  grep = /@session-stress/;
  grepInvert = /@quarantine/;
} else if (isQuarantine) {
  grep = /@quarantine/;
  grepInvert = undefined;
}
const artifactDir = path.resolve(
  process.env.E2E_ARTIFACT_DIR ?? ".context/e2e/artifacts/manual",
);
const viewport = { width: 1440, height: 1000 };
const definedProjects = [
  { name: "chromium", use: { ...devices["Desktop Chrome"], viewport } },
  { name: "firefox", use: { ...devices["Desktop Firefox"], viewport } },
  { name: "webkit", use: { ...devices["Desktop Safari"], viewport } },
];

export default defineConfig({
  testDir: "./e2e/tests",
  testMatch: "**/*.spec.ts",
  tsconfig: "./e2e/tsconfig.json",
  fullyParallel: true,
  workers: 2,
  forbidOnly: isCI,
  failOnFlakyTests: isCI,
  retries: isCI && !isStress && !isQuarantine ? 1 : 0,
  timeout: 45_000,
  globalTimeout: 10 * 60_000,
  expect: { timeout: 10_000 },
  grep,
  grepInvert,
  outputDir: path.join(artifactDir, "test-results"),
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(artifactDir, "html"), open: "never" }],
    ["json", { outputFile: path.join(artifactDir, "report.json") }],
  ],
  use: {
    baseURL: e2eEnv.baseURL,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    viewport,
    headless: true,
    trace: isStress || isQuarantine ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: definedProjects.filter((project) => project.name === "chromium"),
});
