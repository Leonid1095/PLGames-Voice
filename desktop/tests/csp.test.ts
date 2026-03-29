/**
 * Тесты для Content Security Policy — Фаза 2.3
 *
 * Проверяемые проблемы:
 * - Отсутствует CSP в Electron — потенциальная XSS-уязвимость
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("Desktop — Content Security Policy", () => {
  it("CSP должна быть настроена в index.html или main process", () => {
    const indexHtml = readFileSync(
      resolve(__dirname, "../index.html"),
      "utf-8",
    );
    const mainTs = readFileSync(
      resolve(__dirname, "../src/main.ts"),
      "utf-8",
    );

    const hasCSPInHtml =
      indexHtml.includes("Content-Security-Policy") ||
      indexHtml.includes("content-security-policy");

    const hasCSPInMain =
      mainTs.includes("Content-Security-Policy") ||
      mainTs.includes("onHeadersReceived");

    expect(hasCSPInHtml || hasCSPInMain).toBe(true);
  });

  it("CSP не должна содержать unsafe-eval", () => {
    const indexHtml = readFileSync(
      resolve(__dirname, "../index.html"),
      "utf-8",
    );

    // unsafe-eval открывает путь для code injection
    if (indexHtml.includes("Content-Security-Policy")) {
      expect(indexHtml).not.toMatch(/unsafe-eval/);
    }
  });
});
