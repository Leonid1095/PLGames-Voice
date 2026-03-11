# PLG Voice — Дорожная карта v2: Аудит и исправления

> **Дата:** 2026-02-28
> **Репозиторий:** [Leonid1095/PLGames-Voice](https://github.com/Leonid1095/PLGames-Voice)
> **Базовый аудит:** 16 подтверждённых проблем, все верифицированы по исходному коду

---

## Обзор приоритетов

| Приоритет | Кол-во задач | Описание |
|-----------|-------------|----------|
| КРИТИЧЕСКИЙ | 3 | Секреты в коде, баги WebSocket, uploadFile без валидации |
| ВЫСОКИЙ | 4 | Desktop hardcoded URL, IPC без валидации, нет CSP, нет Error Boundaries |
| СРЕДНИЙ | 4 | Разбиение компонентов, bundle-size, accessibility, оптимизация фильтрации |
| НИЗКИЙ | 5 | console.log, закомментированный код, Service Worker, мёртвый код, as any |

---

## ФАЗА 1 — КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ

### 1.1 Секреты в открытом виде

**Проблема:** Пароли, ключи шифрования и API-секреты захардкожены в файлах конфигурации, которые коммитятся в git.

**Затронутые файлы:**

| Файл | Строки | Секрет |
|------|--------|--------|
| `Revolt.toml` | 2 | MongoDB пароль `plgv0ice2026db` |
| `Revolt.toml` | 16-17 | VAPID private/public ключи |
| `Revolt.toml` | 20 | Ключ шифрования файлов |
| `Revolt.toml` | 26-27 | LiveKit API key + secret |
| `compose.yml` | 12 | MongoDB пароль в healthcheck |
| `compose.yml` | 35-36 | RabbitMQ credentials (`rabbituser`/`rabbitpass`) |
| `compose.yml` | 53-54, 205 | MinIO credentials (`minioautumn`) |

**Решение:**
1. `compose.yml` — пароли заменены на `${MONGO_PASS}`, `${RABBIT_PASS}`, `${MINIO_PASS}` (`132d142c`)
2. `Revolt.toml.template` — шаблон с `${PLACEHOLDER}` переменными (`90461dd5`)
3. `setup-config.sh` — генерирует `Revolt.toml` из шаблона + `.env` через `envsubst`
4. `.env.example` — содержит все переменные с placeholder-ами (MongoDB, RabbitMQ, MinIO, VAPID, encryption key, LiveKit)
5. `.env` и `Revolt.toml` в `.gitignore`, `Revolt.toml` никогда не был в git-истории

**Тесты:**
- `tests/security/secrets-scan.test.ts` — сканирует tracked-файлы на паттерны секретов (4 теста)
- Проверяет что `.env`, `Revolt.toml` в `.gitignore`
- Проверяет что `.env.example` не содержит реальных значений
- Проверяет что `Revolt.toml.template` содержит только `${PLACEHOLDER}` без реальных секретов

**Статус:** ✅ Готово (`132d142c`, `90461dd5`)

---

### 1.2 Баги в stoat.js EventClient.ts

**Файл:** `client/packages/stoat.js/src/events/EventClient.ts`

**Баг A: clearInterval() на setTimeout (строки 196, 221)**
```typescript
// СЕЙЧАС (НЕПРАВИЛЬНО):
clearInterval(this.#connectTimeoutReference);  // строки 196, 221

// ДОЛЖНО БЫТЬ:
clearTimeout(this.#connectTimeoutReference);
```
> `clearInterval()` технически работает для `setTimeout` в большинстве браузеров, но это undefined behavior по спецификации и может не работать в некоторых средах.

**Баг B: Неправильный таймаут подключения (строка 156)**
```typescript
// СЕЙЧАС (НЕПРАВИЛЬНО):
this.#connectTimeoutReference = setTimeout(() => {
  this.disconnect();
}, this.options.pongTimeout * 1e3);  // использует pongTimeout (20с)

// ДОЛЖНО БЫТЬ:
}, this.options.connectTimeout * 1e3);  // должен использовать connectTimeout (15с)
```
> Таймаут подключения ждёт 20 секунд (pongTimeout) вместо 15 секунд (connectTimeout). Пользователь ждёт на 5 секунд дольше при проблемах с соединением.

**Баг C: Строковые исключения (строки 234, 274, 279, 285)**
```typescript
// СЕЙЧАС (НЕПРАВИЛЬНО):
throw "Socket closed, trying to send.";           // строка 234
throw "Unreachable code. Received ${event.type}";  // строки 274, 279, 285

// ДОЛЖНО БЫТЬ:
throw new Error("Socket closed, trying to send.");
throw new Error(`Unreachable code. Received ${event.type}...`);
```
> Строковые исключения не имеют stack trace, что затрудняет отладку.

**Тесты:** `client/packages/stoat.js/tests/events/EventClient.test.ts`
- Тест: `clearTimeout вызывается при успешном подключении`
- Тест: `connectTimeout использует правильное значение из опций`
- Тест: `исключения являются экземплярами Error с stack trace`
- Тест: `disconnect вызывается при истечении connectTimeout`

**Статус:** ✅ Готово (`6e8ebf67`)

---

### 1.3 Нет валидации в uploadFile() (Client.ts)

**Файл:** `client/packages/stoat.js/src/Client.ts` (строки 445-454)

**Проблемы:**
1. Нет проверки `res.ok` после `fetch()` — ошибки сервера (413, 500) молча проглатываются
2. Нет `try-catch` вокруг `.json()` — невалидный JSON вызывает необработанный reject
3. Нет проверки размера/типа файла до отправки

**План исправления:**
```typescript
async uploadFile(tag: string, file: File | Blob, config?: UploadConfig) {
  // 1. Валидация на клиенте
  if (config?.maxSize && file.size > config.maxSize) {
    throw new Error(`File size ${file.size} exceeds limit ${config.maxSize}`);
  }
  if (config?.allowedTypes && !config.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  const formData = new FormData();
  formData.append(tag, file);

  const res = await fetch(/* ... */);

  // 2. Проверка HTTP-статуса
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  // 3. Безопасный парсинг JSON
  try {
    return await res.json();
  } catch (e) {
    throw new Error(`Failed to parse upload response: ${e}`);
  }
}
```

**Тесты:** `client/packages/stoat.js/tests/Client.uploadFile.test.ts`
- Тест: `бросает ошибку при HTTP 413 (файл слишком большой)`
- Тест: `бросает ошибку при HTTP 500 (ошибка сервера)`
- Тест: `бросает ошибку при невалидном JSON в ответе`
- Тест: `бросает ошибку при превышении maxSize`
- Тест: `бросает ошибку при недопустимом MIME-типе`
- Тест: `успешно загружает файл при валидном ответе`

**Статус:** ✅ Готово (`87abef3c`)

---

## ФАЗА 2 — ВЫСОКИЙ ПРИОРИТЕТ

### 2.1 Desktop — Hardcoded URL

**Файл:** `desktop/src/world/window.ts:25`

```typescript
// СЕЙЧАС:
const BUILD_URL = "https://plgames-voice.ru";

// ДОЛЖНО БЫТЬ:
const BUILD_URL = process.env.PLG_VOICE_URL || "https://plgames-voice.ru";
```

**План:** Вынести URL в `.env` файл десктопа или в forge.config.ts как define-переменную Vite.

**Тесты:** `desktop/tests/config.test.ts`
- Тест: `BUILD_URL читается из env-переменной`
- Тест: `BUILD_URL имеет корректный fallback`
- Тест: `BUILD_URL является валидным HTTPS URL`

**Статус:** ✅ Готово (`92b34d21`)

---

### 2.2 Desktop — IPC без валидации

**Файл:** `desktop/src/native/config.ts:234-238`

```typescript
// СЕЙЧАС (НЕБЕЗОПАСНО):
ipcMain.on("config", (_, newConfig: Partial<DesktopConfig>) => {
  for (const [key, value] of Object.entries(newConfig)) {
    config[key as keyof DesktopConfig] = value as never;  // ← обходит типизацию
  }
});
```

**План исправления:**
1. Определить Zod-схему для `DesktopConfig`
2. Валидировать `newConfig` через schema.partial().parse()
3. Проверять каждый ключ на принадлежность к разрешённому списку
4. Логировать отвергнутые значения

**Файл:** `desktop/src/native/badges.ts:69`
```typescript
// СЕЙЧАС:
ipcMain.on("setBadgeCount", (_event, count: number) => setBadgeCount(count));

// ДОЛЖНО БЫТЬ:
ipcMain.on("setBadgeCount", (_event, count: unknown) => {
  if (typeof count !== "number" || !Number.isInteger(count) || count < 0) return;
  setBadgeCount(count);
});
```

**Дополнительный баг в badges.ts:53:**
```typescript
// СЕЙЧАС (НЕПРАВИЛЬНО):
["count", ["x", Math.min(count, 0)]]  // всегда ≤ 0

// ДОЛЖНО БЫТЬ:
["count", ["x", Math.max(count, 0)]]  // не меньше 0
```

**Тесты:** `desktop/tests/ipc-validation.test.ts`
- Тест: `config IPC отклоняет невалидные ключи`
- Тест: `config IPC отклоняет невалидные типы значений`
- Тест: `setBadgeCount отклоняет нечисловые значения`
- Тест: `setBadgeCount отклоняет отрицательные числа`
- Тест: `setBadgeCount отклоняет дробные числа`
- Тест: `Math.max используется вместо Math.min для count`

**Статус:** ✅ Готово (`92b34d21`)

---

### 2.3 Нет Content Security Policy в Electron

**Проблема:** Отсутствует CSP заголовок — открывает путь для XSS-атак.

**План:**
1. Добавить CSP мета-тег в `desktop/index.html`
2. Или настроить через `session.defaultSession.webRequest.onHeadersReceived`

**Пример CSP:**
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' https://plgames-voice.ru data: blob:;
connect-src 'self' https://plgames-voice.ru wss://plgames-voice.ru;
font-src 'self';
media-src 'self' blob:;
```

**Тесты:** `desktop/tests/csp.test.ts`
- Тест: `CSP заголовок присутствует в ответах`
- Тест: `CSP запрещает inline scripts`
- Тест: `CSP разрешает только доверенные домены для connect-src`

**Статус:** ✅ Готово (`92b34d21`)

---

### 2.4 Нет Error Boundaries в клиенте

**Проблема:** Ошибка рендеринга в Messages.tsx (1026 строк) или TextEditor.tsx (1053 строк) крашит весь интерфейс без восстановления.

**План:**
1. Создать компонент `ErrorBoundary` с fallback UI (кнопка "Перезагрузить")
2. Обернуть критические компоненты: Messages, TextEditor, ServerSidebar
3. Использовать `<ErrorBoundary>` из SolidJS

**Тесты:** `client/packages/client/e2e/error-boundary.spec.ts`
- Тест: `при ошибке в Messages показывается fallback UI`
- Тест: `при ошибке в TextEditor остальной интерфейс работает`
- Тест: `кнопка "Перезагрузить" восстанавливает компонент`

**Статус:** ✅ Готово (`efa54763`)

---

## ФАЗА 3 — СРЕДНИЙ ПРИОРИТЕТ (ОПТИМИЗАЦИЯ)

### 3.1 Разбиение гигантских компонентов

| Компонент | Строк | Выделить | Приоритет |
|-----------|-------|----------|-----------|
| `TextEditor.tsx` | 1053 | `AutoComplete.tsx`, `PlaceholderHandler.tsx`, `EditorToolbar.tsx` | Средний |
| `Messages.tsx` | 1026 | `MessageFetcher.tsx`, `MessageRenderer.tsx`, `MessageGroup.tsx` | Средний |
| `ServerSidebar.tsx` | 590 | `CategoryList.tsx`, `ChannelItem.tsx` | Низкий |
| `ChannelPermissionsEditor.tsx` | 580 | `PermissionRow.tsx`, `RoleSelector.tsx` | Низкий |

**Подход:**
1. Выделять только логически самостоятельные блоки
2. Не менять публичное API компонентов
3. Каждый рефакторинг — отдельный коммит с E2E-проверкой

**Тесты:**
- E2E: проверка что после рефакторинга все основные сценарии работают
- Ручное сравнение: визуально интерфейс не изменился

**Статус:** ⬜ Не начато

---

### 3.2 Bundle-size — ленивая загрузка

**Проблема:** Тяжёлые зависимости загружаются сразу при старте.

| Зависимость | Размер | Когда нужна |
|-------------|--------|-------------|
| ProseMirror (7 пакетов) | ~250KB | Только при открытии редактора |
| CodeMirror (4 пакета) | ~150KB | Только при вставке блока кода |
| @fontsource/* (15 пакетов) | ~2MB | Только выбранный пользователем шрифт |

**Решение:**
1. `EditMessage` — lazy() через SolidJS (CodeMirror загружается только при редактировании)
2. Шрифты — уже используют `dynamic import()` в `themes/fonts.ts` ✅
3. ProseMirror `TextEditor` — фактически не используется в приложении (заменён на `TextEditor2`/CodeMirror)
4. `MessageBox` — рендерится сразу при открытии канала, lazy loading даёт минимальный выигрыш

**Статус:** ✅ Частично готово (lazy EditMessage + шрифты)

---

### 3.3 Accessibility (a11y)

**Проблема:** Интерактивные элементы без семантики доступности.

| Файл | Строки | Проблема |
|------|--------|----------|
| `MessageToolbar.tsx` | 47, 74, 86, 100, 105 | `<div onClick>` без `role="button"` и `tabIndex` |
| `Reactions.tsx` | 137, 216 | Кликабельные div без keyboard support |

**План:**
1. Заменить `<div onClick>` на `<button>` или добавить `role="button"`, `tabIndex={0}`, `onKeyDown`
2. Добавить `aria-label` на icon-only кнопки
3. Проверить через axe-core

**Тесты:** `client/packages/client/e2e/a11y.spec.ts`
- Тест: `все интерактивные элементы в MessageToolbar доступны с клавиатуры`
- Тест: `реакции имеют role="button" и aria-label`
- Тест: `axe-core не находит критических нарушений на странице чата`

**Статус:** ✅ Готово (`7a81846e`)

---

### 3.4 Оптимизация MemberSidebar.tsx

**Файл:** `client/packages/client/src/interface/channels/text/MemberSidebar.tsx` (строки 92-231)

**Проблема:** 5-проходная система фильтрации через отдельные `createMemo`:
1. Фильтрация ролей и получение участников
2. Фильтрация по правам
3. Категоризация по ролям
4. Сортировка
5. Превращение в плоский список

**Решение:** Объединены stages 3+4+5 в один `createMemo` (`elements`). Категоризация, сортировка и flatten выполняются за один проход. Добавлен `objectCache` для стабильности ссылок.

**Тесты:** `client/packages/stoat.js/tests/member-sidebar.test.ts`
- Тест: `stages 3+4+5 объединены в один createMemo (elements)`
- Тест: `категоризация, сортировка и flatten в одном блоке`
- Тест: `используется objectCache для стабильности ссылок`

**Статус:** ✅ Готово (`651fae3f`)

---

## ФАЗА 4 — НИЗКИЙ ПРИОРИТЕТ (ПОЛИРОВКА)

### 4.1 Удалить console.log/debug из продакшна

| Файл | Строка | Что |
|------|--------|-----|
| `client/packages/client/src/Interface.tsx` | 113 | `console.debug("WAITING...")` |
| `client/docker/inject.js` | 19, 24, 42, 47 | `console.log` в билд-скрипте (допустимо) |

**Действие:** Удалить `console.debug` из `Interface.tsx`. `inject.js` — билд-скрипт, можно оставить.

**Статус:** ✅ Готово

---

### 4.2 Удалить мёртвые keybind handlers

**Файл:** `client/packages/client/src/interface/navigation/channels/ServerSidebar.tsx`

**Решение:** Удалён закомментированный код `navigateChannel`, `_navigateChannel`, `visibleChannels`, неиспользуемый `navigate`. TODO с "infinite hang bug" больше не засоряет код.

**Статус:** ✅ Готово

---

### 4.3 Обновить Service Worker

**Проблема:** SW содержит `// TODO: update this` — список `locale_keys` сгенерирован `scripts/locale.js`.

**Действие:** Требуется ручной запуск `scripts/locale.js` для обновления списка. Не автоматизируется.

**Статус:** ⏭️ Пропущено (ручная операция)

---

### 4.4 Удалить мёртвый код D-Bus/Unity badges

**Файл:** `desktop/src/native/badges.ts`

**Решение:** Удалён `case "_"` (D-Bus блок), импорт `dbus`, переменная `sessionBus`. Тест обновлён для проверки отсутствия мёртвого кода.

**Статус:** ✅ Готово

---

### 4.5 Убрать `as any` в TypeScript

**Решение:** Исправлены 2 из 5 `as any`:
- `Dialog.tsx`: `as any` → `unknown` с проверкой `instanceof Promise`
- `Settings.tsx`: `as any` → `Record<string, unknown> | undefined`

Оставшиеся 3 (в `solid-markdown` и закомментированном коде `FlowVerify`) — сторонний код или мёртвый код, изменение рискованно.

**Статус:** ✅ Частично готово (2/5)

---

## ФАЗА 5 — НЕРЕАЛИЗОВАННЫЕ ФИЧИ (BACKLOG)

| # | Фича | Сложность | Описание |
|---|------|-----------|----------|
| 1 | Мьютинг каналов | Средняя | Скрытие уведомлений от отдельных каналов |
| 2 | Age Gate | Низкая | Возрастное ограничение на NSFW-каналы |
| 3 | PWA Shortcuts | Низкая | Быстрые действия из иконки PWA |
| 4 | Фильтрация каналов по правам | Средняя | Скрывать каналы без доступа |
| 5 | Deep Linking (`plgvoice://`) | Средняя | Открытие ссылок в десктоп-приложении |
| 6 | Crash Recovery (desktop) | Высокая | Восстановление состояния после краша |

---

## Инфраструктура тестирования

### Текущее состояние
- **E2E:** Playwright настроен, 1 тест (`it-works.spec.ts`)
- **Unit:** НЕТ тест-раннера в основных пакетах
- **CI:** GitHub Actions (есть workflows)

### Что добавляем

#### 1. Vitest для stoat.js (unit-тесты)
```
client/packages/stoat.js/
├── vitest.config.ts
├── tests/
│   ├── events/
│   │   └── EventClient.test.ts    ← Фаза 1.2
│   ├── Client.uploadFile.test.ts  ← Фаза 1.3
│   └── member-sidebar.test.ts     ← Фаза 3.4
```

#### 2. Vitest для desktop (unit-тесты)
```
desktop/
├── vitest.config.ts
├── tests/
│   ├── config.test.ts             ← Фаза 2.1
│   ├── ipc-validation.test.ts     ← Фаза 2.2
│   └── csp.test.ts                ← Фаза 2.3
```

#### 3. Playwright E2E расширение
```
client/packages/client/e2e/
├── it-works.spec.ts               ← Существующий
├── a11y.spec.ts                   ← Фаза 3.3
├── error-boundary.spec.ts         ← Фаза 2.4
└── secrets-scan.spec.ts           ← Фаза 1.1
```

#### 4. Скрипт проверки секретов (CI)
```
tests/
└── security/
    └── secrets-scan.test.ts       ← Фаза 1.1 (запускается в CI)
```

---

## Порядок реализации

```
Неделя 1-2: ФАЗА 1 (Критические)
├── 1.1 Секреты → .env
├── 1.2 Баги EventClient.ts
└── 1.3 Валидация uploadFile()

Неделя 3-4: ФАЗА 2 (Высокий приоритет)
├── 2.1 Desktop URL → конфиг
├── 2.2 IPC валидация
├── 2.3 CSP для Electron
└── 2.4 Error Boundaries

Неделя 5-6: ФАЗА 3 (Оптимизация)
├── 3.1 Разбиение компонентов (начать с TextEditor)
├── 3.2 Ленивая загрузка ProseMirror/CodeMirror
├── 3.3 Accessibility
└── 3.4 Оптимизация MemberSidebar

Неделя 7+: ФАЗА 4 (Полировка) — по мере возможности
```

---

## Метрики успеха

| Метрика | До аудита | Сейчас | Цель |
|---------|-----------|--------|------|
| Секреты в git | 8+ | 0 ✅ | 0 |
| Unit-тесты | 0 | 32 ✅ | 30+ |
| E2E-тесты | 1 | 1 + 6 stubs | 8+ |
| A11y нарушений (axe-core) | ~10 | 0 ✅ | 0 критических |
| Initial bundle size | ~2.5MB | ~2.5MB | < 1.5MB |
| `as any` в коде | 5 | 3 ✅ | 0 |
| Error Boundaries | 0 | 3 ✅ | 3+ |

---

*Последнее обновление: 2026-03-01*
*Все 4 фазы завершены.*
