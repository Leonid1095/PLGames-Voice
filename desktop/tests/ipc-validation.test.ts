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

  it("IPC обработчик config не должен использовать 'as never' для присвоения", () => {
    // Ищем блок ipcMain.on("config"...) и проверяем что нет 'as never' внутри
    const ipcBlock = configSource.match(
      /ipcMain\.on\("config"[\s\S]*?\}\);/,
    );
    expect(ipcBlock).not.toBeNull();
    if (ipcBlock) {
      expect(ipcBlock[0]).not.toContain("as never");
    }
  });

  it("должен валидировать входящие данные в IPC обработчике config", () => {
    // Ищем паттерн валидации: typeof проверки, whitelist ключей, или schema
    const hasValidation =
      configSource.includes("typeof newConfig") ||
      configSource.includes("typeof value") ||
      configSource.includes("ALLOWED_CONFIG_KEYS") ||
      configSource.includes(".parse(") ||
      configSource.includes(".safeParse(");

    expect(hasValidation).toBe(true);
  });
});

describe("Desktop IPC — badges.ts валидация", () => {
  const badgesSource = readFileSync(
    resolve(__dirname, "../src/native/badges.ts"),
    "utf-8",
  );

  it("setBadgeCount IPC должен валидировать тип count", () => {
    // Должна быть проверка typeof count === "number" или Number.isInteger
    const ipcBlock = badgesSource.match(
      /ipcMain\.on\("setBadgeCount"[\s\S]*?\}\);/,
    );
    expect(ipcBlock).not.toBeNull();
    if (ipcBlock) {
      const hasTypeCheck =
        ipcBlock[0].includes("typeof count") ||
        ipcBlock[0].includes("Number.isInteger") ||
        ipcBlock[0].includes("Number.isFinite");
      expect(hasTypeCheck).toBe(true);
    }
  });

  it("должен использовать Math.max, а не Math.min для count", () => {
    // Math.min(count, 0) всегда возвращает ≤ 0, что неправильно
    // Должно быть Math.max(count, 0) — не меньше 0
    expect(badgesSource).not.toMatch(/Math\.min\(count,\s*0\)/);
    expect(badgesSource).toMatch(/Math\.max\(count,\s*0\)/);
  });
});
