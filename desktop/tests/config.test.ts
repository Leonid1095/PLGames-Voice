/**
 * Тесты для Desktop конфигурации — Фаза 2.1
 *
 * Проверяемые проблемы:
 * - Hardcoded URL в window.ts:25
 * - URL должен читаться из env или конфига
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Desktop — конфигурация URL", () => {
  const windowSource = readFileSync(
    resolve(__dirname, "../src/native/window.ts"),
    "utf-8",
  );

  it("BUILD_URL должен поддерживать env-переменную, а не только hardcode", () => {
    // Должен содержать process.env.PLG_VOICE_URL или аналогичный механизм
    const hasEnvSupport =
      windowSource.includes("process.env.PLG_VOICE_URL") ||
      windowSource.includes("import.meta.env") ||
      windowSource.includes("getConfig");

    expect(hasEnvSupport).toBe(true);
  });

  it("DEFAULT_URL fallback должен быть валидным HTTPS URL", () => {
    const urlMatch = windowSource.match(
      /DEFAULT_URL\s*=\s*["'`](https:\/\/[^"'`]+)["'`]/,
    );
    expect(urlMatch).not.toBeNull();
    if (urlMatch) {
      expect(() => new URL(urlMatch[1])).not.toThrow();
      expect(urlMatch[1]).toMatch(/^https:\/\//);
    }
  });
});
