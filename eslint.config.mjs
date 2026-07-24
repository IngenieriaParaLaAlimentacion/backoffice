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
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/",
  ]),
]);

export default eslintConfig;
