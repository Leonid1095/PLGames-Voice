/**
 * E2E тесты Accessibility — Фаза 3.3
 *
 * Проверяемые проблемы:
 * - MessageToolbar.tsx: <div onClick> без role="button"
 * - Reactions.tsx: кликабельные div без keyboard support
 * - Icon-only кнопки без aria-label
 */
import { expect, test } from "@playwright/test";

test.describe("Accessibility — базовые проверки", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Требуется авторизованная сессия и открытый канал
    // await loginAndOpenChannel(page);
  });

  test("интерактивные элементы в тулбаре сообщений должны быть кнопками", async ({
    page,
  }) => {
    test.skip(true, "Требует запущенного сервера и авторизации — Фаза 3.3");

    // После исправления все интерактивные элементы должны быть <button>
    // или иметь role="button" + tabIndex + onKeyDown
    const toolbar = page.locator('[class*="toolbar"]');
    const clickableElements = toolbar.locator("[onclick], [onClick]");

    const count = await clickableElements.count();
    for (let i = 0; i < count; i++) {
      const el = clickableElements.nth(i);
      const tag = await el.evaluate((node) => node.tagName.toLowerCase());
      const role = await el.getAttribute("role");
      const tabIndex = await el.getAttribute("tabindex");

      if (tag !== "button" && tag !== "a") {
        expect(role).toBe("button");
        expect(tabIndex).not.toBeNull();
      }
    }
  });

  test("реакции должны быть доступны с клавиатуры", async ({ page }) => {
    test.skip(true, "Требует запущенного сервера и авторизации — Фаза 3.3");

    const reactions = page.locator('[class*="reaction"]');
    const count = await reactions.count();

    for (let i = 0; i < count; i++) {
      const el = reactions.nth(i);
      const tag = await el.evaluate((node) => node.tagName.toLowerCase());
      const role = await el.getAttribute("role");

      if (tag !== "button") {
        expect(role).toBe("button");
      }
    }
  });

  test("icon-only кнопки должны иметь aria-label", async ({ page }) => {
    test.skip(true, "Требует запущенного сервера и авторизации — Фаза 3.3");

    // Все кнопки без текстового содержимого должны иметь aria-label
    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute("aria-label");
      const title = await btn.getAttribute("title");

      if (!text?.trim()) {
        expect(ariaLabel || title).toBeTruthy();
      }
    }
  });
});
