import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/**/*.test.ts",
      "client/packages/stoat.js/tests/**/*.test.ts",
      "desktop/tests/**/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/js-lingui-solid/**",
      "**/e2e/**",
    ],
    environment: "node",
    globals: true,
  },
});
