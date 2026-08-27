import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",

      // Only complain when EVERY binding in a destructuring could be const.
      // The default ("any") fires on `let { data, error } = await supabase…`
      // whenever `error` alone is never reassigned, and there is no correct
      // fix for that — `const` would break the reassignment of `data`. The
      // alternative is splitting seven of those into two statements each,
      // which is noise rather than safety.
      "prefer-const": ["error", { destructuring: "all" }],
    },
  },
  {
    // shadcn/ui primitives are vendored, generated from the upstream registry,
    // and re-generated when a component is added. Local edits get lost, so the
    // two `interface X extends Y {}` declarations there are left as upstream
    // writes them.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Tailwind plugins are CommonJS; `require()` is how the config is meant to
    // load them.
    files: ["tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);
