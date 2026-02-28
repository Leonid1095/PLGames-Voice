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
    resolve(__dirname, "../src/world/window.ts"),
    "utf-8",
  );

  it("BUILD_URL не должен быть захардкожен напрямую", () => {
    // После исправления URL должен читаться из env или конфига
    // Допустимо: process.env.PLG_VOICE_URL || "https://..."
    // Недопустимо: const BUILD_URL = "https://cvaboda.duckdns.org"
    const hardcodedPattern =
      /const\s+BUILD_URL\s*=\s*["'`]https?:\/\/[^"'`]+["'`]\s*;/;
    const envPattern = /process\.env\.|import\.meta\.env\.|getConfig|VITE_/;

    const hasHardcodedOnly =
      hardcodedPattern.test(windowSource) && !envPattern.test(windowSource);
    expect(hasHardcodedOnly).toBe(false);
  });

  it("BUILD_URL fallback должен быть валидным HTTPS URL", () => {
    const urlMatch = windowSource.match(
      /["'`](https:\/\/[^"'`]+)["'`]/,
    );
    expect(urlMatch).not.toBeNull();
    if (urlMatch) {
      expect(() => new URL(urlMatch[1])).not.toThrow();
      expect(urlMatch[1]).toMatch(/^https:\/\//);
    }
  });
});
