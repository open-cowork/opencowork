import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "no-console": "error",
    },
  },
  {
    files: [
      "lib/logger.ts",
      "features/chat/components/execution/file-panel/doc-viewer-client.tsx",
    ],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
