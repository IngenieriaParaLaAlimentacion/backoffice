import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    exclude: [
      ...configDefaults.exclude,
      "e2e/**",
      "playwright.config.ts",
      ".context/**",
    ],
    coverage: {
      provider: "v8",
      // lcov → coverage/lcov.info, the file CI uploads to Codecov.
      reporter: ["text", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
