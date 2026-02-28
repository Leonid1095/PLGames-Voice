/**
 * E2E тесты Error Boundaries — Фаза 2.4
 *
 * Проверяемые проблемы:
 * - Ошибка в Messages.tsx крашит весь UI
 * - Ошибка в TextEditor.tsx крашит весь UI
 * - Нет graceful fallback
 */
import { expect, test } from "@playwright/test";

test.describe("Error Boundaries", () => {
  test("при ошибке рендеринга показывается fallback UI вместо белого экрана", async ({
    page,
  }) => {
    test.skip(true, "Требует запущенного сервера — Фаза 2.4");

    // Этот тест проверяет что Error Boundary ловит ошибки рендеринга
    // и показывает пользователю понятное сообщение вместо пустого экрана

    // TODO: Инжектировать ошибку через page.evaluate или моковый API
    // await page.goto("");
    // const fallback = page.locator('[data-testid="error-fallback"]');
    // await expect(fallback).toBeVisible();
    // await expect(fallback).toContainText("Произошла ошибка");
  });

  test("кнопка повторной загрузки восстанавливает компонент", async ({
    page,
  }) => {
    test.skip(true, "Требует запущенного сервера — Фаза 2.4");

    // TODO: После показа fallback, нажатие "Перезагрузить" восстанавливает
    // const retryButton = page.locator('[data-testid="error-retry"]');
    // await retryButton.click();
    // await expect(page.locator('[data-testid="messages-container"]')).toBeVisible();
  });

  test("боковая панель продолжает работать при ошибке в чате", async ({
    page,
  }) => {
    test.skip(true, "Требует запущенного сервера — Фаза 2.4");

    // Даже если Messages крашится, навигация должна работать
    // const sidebar = page.locator('[class*="sidebar"]');
    // await expect(sidebar).toBeVisible();
    // const channels = sidebar.locator('[class*="channel"]');
    // await expect(channels.first()).toBeClickable();
  });
});
