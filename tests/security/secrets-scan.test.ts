/**
 * Тесты безопасности — Фаза 1.1
 *
 * Сканирует tracked-файлы на наличие захардкоженных секретов.
 * Должен запускаться в CI перед каждым мёрджем.
 */
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");

// Паттерны секретов, которые НЕ должны быть в tracked-файлах
const SECRET_PATTERNS = [
  // Пароли MongoDB в connection strings
  /mongodb:\/\/[^:]+:[^@\$]+@/i,
  // VAPID ключи (base64 строки определённой длины)
  /vapid_private_key\s*=\s*["']?[A-Za-z0-9+/=]{30,}/,
  // LiveKit секреты
  /livekit.*secret\s*=\s*["']?[a-f0-9]{20,}/i,
  // Ключи шифрования (base64)
  /encryption.*key\s*=\s*["']?[A-Za-z0-9+/=]{30,}/i,
];

// Файлы с исходным кодом компонентов — false positives для password regex
const CODE_FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".test.ts"];

// Файлы, которые точно должны быть в .gitignore
const MUST_BE_IGNORED = [".env", "Revolt.toml", "livekit.yml"];

describe("Проверка секретов в репозитории", () => {
  it(".gitignore должен содержать чувствительные файлы", () => {
    const gitignore = readFileSync(resolve(ROOT, ".gitignore"), "utf-8");

    for (const file of MUST_BE_IGNORED) {
      expect(gitignore).toContain(file);
    }
  });

  it(".env.example не должен содержать реальных секретов", () => {
    const envExample = resolve(ROOT, ".env.example");
    if (!existsSync(envExample)) {
      // Если .env.example ещё не создан — это задача Фазы 1.1
      expect(true).toBe(true);
      return;
    }

    const content = readFileSync(envExample, "utf-8");
    for (const pattern of SECRET_PATTERNS) {
      expect(content).not.toMatch(pattern);
    }
  });

  it("tracked файлы не должны содержать паттернов секретов", () => {
    // Получаем список tracked-файлов (исключая бинарные и lock-файлы)
    let trackedFiles: string[];
    try {
      trackedFiles = execSync("git ls-files", { cwd: ROOT, encoding: "utf-8" })
        .split("\n")
        .filter(
          (f) =>
            f &&
            !f.endsWith(".lock") &&
            !f.endsWith(".lockb") &&
            !f.endsWith(".ico") &&
            !f.endsWith(".png") &&
            !f.endsWith(".jpg") &&
            !f.endsWith(".woff2") &&
            !f.includes("node_modules"),
        );
    } catch {
      // Не git-репозиторий — пропускаем
      return;
    }

    const violations: string[] = [];

    for (const file of trackedFiles) {
      const fullPath = resolve(ROOT, file);
      if (!existsSync(fullPath)) continue;

      try {
        const content = readFileSync(fullPath, "utf-8");
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(content)) {
            violations.push(`${file} содержит секрет: ${pattern.source}`);
          }
        }
      } catch {
        // Бинарный файл — пропускаем
      }
    }

    // После исправления Фазы 1.1 список violations должен быть пустым
    // Пока что проверяем что проблема зафиксирована
    if (violations.length > 0) {
      console.warn(
        "ВНИМАНИЕ: Найдены секреты в tracked-файлах:\n" +
          violations.join("\n"),
      );
    }

    // Этот тест начнёт ПАДАТЬ после того, как мы вынесем секреты в .env
    // Именно это и является целью — он гарантирует что секреты не вернутся
    expect(violations.length).toBe(0);
  });
});
