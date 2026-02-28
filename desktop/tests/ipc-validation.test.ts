/**
 * Тесты для IPC валидации — Фаза 2.2
 *
 * Проверяемые проблемы:
 * - config.ts:234 — IPC принимает данные без валидации, использует `as never`
 * - badges.ts:69 — нет проверки типа входного числа
 * - badges.ts:53 — Math.min вместо Math.max
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Desktop IPC — config.ts валидация", () => {
  const configSource = readFileSync(
    resolve(__dirname, "../src/native/config.ts"),
    "utf-8",
  );

  it("не должен использовать 'as never' для обхода типизации", () => {
    const asNeverCount = (configSource.match(/as never/g) || []).length;
    expect(asNeverCount).toBe(0);
  });

  it("должен валидировать входящие данные в IPC обработчике config", () => {
    // Ищем паттерн валидации: zod schema, typeof проверки, или whitelist ключей
    const hasValidation =
      configSource.includes(".parse(") ||
      configSource.includes(".safeParse(") ||
      configSource.includes("typeof ") ||
      configSource.includes("allowedKeys") ||
      configSource.includes("Object.keys(") ||
      configSource.includes("hasOwnProperty");

    expect(hasValidation).toBe(true);
  });
});

describe("Desktop IPC — badges.ts валидация", () => {
  const badgesSource = readFileSync(
    resolve(__dirname, "../src/native/badges.ts"),
    "utf-8",
  );

  it("setBadgeCount должен валидировать тип count", () => {
    // Должна быть проверка typeof count === "number" или аналогичная
    const hasTypeCheck =
      badgesSource.includes('typeof count') ||
      badgesSource.includes("Number.isInteger") ||
      badgesSource.includes("Number.isFinite") ||
      badgesSource.includes(".parse(");

    expect(hasTypeCheck).toBe(true);
  });

  it("должен использовать Math.max, а не Math.min для count", () => {
    // Math.min(count, 0) всегда возвращает ≤ 0, что неправильно
    // Должно быть Math.max(count, 0) — не меньше 0
    expect(badgesSource).not.toMatch(/Math\.min\(count,\s*0\)/);
    expect(badgesSource).toMatch(/Math\.max\(count,\s*0\)/);
  });
});
