import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * ESLint 9 flat config bridging to `eslint-config-next`, which is still eslintrc-format
 * at next@15.3 — its export is `{ extends: [...] }` naming a file path and
 * `plugin:@next/next/core-web-vitals`, neither of which flat config resolves natively.
 *
 * The previous config did `...nextVitals`, which threw `TypeError: nextVitals is not
 * iterable` before eslint could start. That is worse than having no lint config at all:
 * `npm run lint` failed identically whether the code was clean or full of errors, so
 * nothing in this project was ever actually linted.
 *
 * `FlatCompat` is the supported bridge until eslint-config-next ships flat config.
 */
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "coverage/**",
      "public/**",
      "node_modules/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Deliberate: the codebase uses `void promise` to mark intentionally
      // un-awaited work (analytics, cache invalidation), which this rule flags.
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
];
