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
      // Vitest 4 only reports files a test imported unless `include` is set; listing the
      // source dirs makes an untested file count as 0% instead of vanishing. This is the
      // single source of truth for coverage scope — codecov.yml doesn't re-filter.
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "constants/**/*.ts",
        "context/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "schemas/**/*.ts",
        "services/**/*.ts",
        "proxy.ts",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "components/ui/**", // shadcn-generated
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
