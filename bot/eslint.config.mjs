import js from "@eslint/js";
import globals from "globals";

// PLG Voice admin bot — baseline lint config.
// The bot is a large legacy CommonJS file (index.js ~2950 LOC) that has never
// been linted. Start with eslint:recommended + Node globals, but keep the
// noisier rules as "warn" so the lint is actionable rather than a wall of red
// that gets ignored. New code should aim for zero warnings.
export default [
  {
    ignores: ["node_modules/", "eslint.config.mjs"],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          // `catch (_) {}` is an intentional swallow throughout the bot
          // (shutdown paths, best-effort cleanups). Don't flag it.
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-undef": "error",
      "no-redeclare": "error",
    },
  },
];
