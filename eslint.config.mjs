import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  prettierConfig,
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler-only rules: this project doesn't use the compiler,
      // so they flag ordinary fetch-in-effect and react-hook-form usage as errors.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    // Leaflet stays behind the `pins -> onPinClick` contract of the establishments
    // map (docs/adr/0003-establishments-map-libraries.md): only its `leaflet/`
    // folder may import it, so swapping the library is a one-folder rewrite.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(leaflet|react-leaflet)($|/|\\.)",
              message:
                "Import Leaflet only from a `map/leaflet/` folder (docs/adr/0003).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/map/leaflet/**"],
    rules: { "no-restricted-imports": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "public/",
    ".context/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
