import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/\\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|to|via|fill|stroke|divide|placeholder|outline)-(?:slate|gray|zinc|emerald|blue)-[0-9]+(?:\\/[0-9]+)?\\b/]",
          message: "Use semantic design tokens instead of fixed Tailwind palette utilities.",
        },
        {
          selector: "Literal[value=/\\b(?:[a-z-]+:)*bg-white\\b/]",
          message: "Use bg-card or bg-background instead of bg-white.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
