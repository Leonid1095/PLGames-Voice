/**
 * E2E тесты Error Boundaries — Фаза 2.4
 *
 * Проверяемые проблемы:
 * - Ошибка в Messages.tsx крашит весь UI
 * - Ошибка в TextEditor.tsx крашит весь UI
 * - Нет graceful fallback
 */
import { expect, test } from "@playwright/test";

test.describe("Error Boundaries — E2E", () => {
  test("при ошибке рендеринга показывается fallback UI вместо белого экрана", async ({
    page,
  }) => {
    test.skip(true, "Требует запущенного сервера и авторизации");

    // Инжектировать ошибку через page.evaluate или моковый API
    // await page.goto("");
    // const fallback = page.locator('[data-testid="error-fallback"]');
    // await expect(fallback).toBeVisible();
    // await expect(fallback).toContainText("Произошла ошибка");
  });

  test("кнопка повторной загрузки восстанавливает компонент", async ({
    page,
  }) => {
    test.skip(true, "Требует запущенного сервера и авторизации");

    // const retryButton = page.locator('[data-testid="error-retry"]');
    // await retryButton.click();
  });

  test("боковая панель продолжает работать при ошибке в чате", async ({
    page,
  }) => {
    test.skip(true, "Требует запущенного сервера и авторизации");

    // Даже если Messages крашится, навигация должна работать
  });
});
