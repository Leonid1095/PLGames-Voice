# ROADMAP V6 — UI Modernization Plan

**PLG Voice: "From 2007 to 2025"**
Дата: 2026-04-06

---

## Текущее состояние

### Что хорошо (не трогаем)
- Material Design 3 цветовая система с динамической генерацией тем
- Token-based дизайн (60+ CSS переменных)
- Виртуальный скроллинг в списках (HomeSidebar, Messages)
- Drag & drop серверов и категорий
- Система вариантов кнопок (CVA) — грамотная архитектура
- Поддержка prefers-reduced-motion
- Krisp AI шумоподавление
- Серверная иконка с indicator bar (36px + glow shadow)

### Главные проблемы (почему "выглядит как 2007")
1. **Нет скелетонов загрузки** — только спиннер, контент появляется рывком
2. **Нет in-app тостов** — только браузерные уведомления
3. **Плоские контекстные меню** — без иконок, без шорткатов
4. **Код-блоки не адаптируются к теме** — хардкод GitHub Dark (#0d1117)
5. **Голос: все тайлы одного размера** — нет фокуса на говорящем, screen share не увеличивается
6. **Нет мобильной адаптации** — 0 media queries, только десктоп
7. **Typing indicator без анимации** — просто текст
8. **Тулбар сообщений сверху** — неудобно, Discord ставит справа
9. **MDUI веб-компоненты** конфликтуют со styled-system (TextField, Checkbox)
10. **Нет hover-эффектов глубины** — плоские переходы без теней

---

## Phase 1: Quick Wins (1-2 дня)

Максимальный визуальный эффект при минимальных изменениях.

### 1.1 Скелетоны загрузки
**Файлы:** Новый компонент `Skeleton.tsx` в `ui/components/design/`
- Шиммер-анимация (уже есть keyframe `skeletonShimmer` в styles.css)
- Варианты: text, avatar, card, message
- Заменить спиннер `mdui-circular-progress` в ключевых местах:
  - Список сообщений (Messages.tsx)
  - Список каналов (ServerSidebar.tsx)
  - Профиль пользователя (UserCard.tsx)

### 1.2 Typing Indicator с анимацией
**Файл:** `ui/components/features/messaging/composition/TypingIndicator.tsx`
- Добавить 3 анимированные точки (bouncing dots) рядом с текстом
- CSS keyframe: translateY с задержкой для каждой точки
- Discord-стиль: `...` пульсирует

### 1.3 Код-блоки с адаптивной темой
**Файл:** `components/markdown/plugins/Codeblock.tsx`
- Заменить хардкод `#0d1117` / `#c9d1d9` на CSS переменные:
  - `background: var(--md-sys-color-surface-container-high)`
  - `color: var(--md-sys-color-on-surface)`
- Кнопка копирования: Material Icon вместо Unicode символов

### 1.4 Hover-эффекты с глубиной
**Файлы:** `MenuButton.tsx`, `Avatar.tsx`, message containers
- Добавить `box-shadow` переход на hover (elevation-1 → elevation-2)
- Сообщения: мягкая тень + легкий подъём вместо простой смены фона
- Кнопки каналов: subtle scale(1.01) + shadow

---

## Phase 2: Core UX (3-5 дней)

### 2.1 In-App Toast система
**Новые файлы:**
- `ui/components/design/Toast.tsx` — компонент тоста
- `ui/components/design/ToastProvider.tsx` — провайдер + стек
- `hooks/useToast.ts` — хук для вызова

**Дизайн:**
- 4 типа: success (зелёный), error (красный), info (синий), warning (жёлтый)
- Позиция: bottom-right
- Авто-dismiss: 5 секунд
- Анимация: slideIn справа + fadeOut
- Стек до 3 тостов

**Интеграция:**
- Замена alert() вызовов
- Уведомление при копировании текста/ID
- Уведомление при pin/unpin
- Ошибки подключения к голосу

### 2.2 Контекстные меню с иконками
**Файл:** `app/menus/ContextMenu.tsx` + все *ContextMenu.tsx
- Добавить `icon` prop к `ContextMenuButton`
- Material Symbols 18px слева от текста
- Шорткаты справа (серый текст): Ctrl+C, Del, etc.
- Анимация открытия: scale(0.95→1) + opacity

**Иконки для MessageContextMenu:**
| Действие | Иконка |
|----------|--------|
| Reply | `reply` |
| Edit | `edit` |
| Delete | `delete` |
| Copy | `content_copy` |
| Pin | `push_pin` |
| Mark Unread | `mark_email_unread` |
| React | `add_reaction` |
| Forward | `forward` |

### 2.3 Тулбар сообщений — перемещение
**Файл:** `ui/components/features/messaging/elements/MessageToolbar.tsx`
- Перенести из `top: -18px, right: 16px` в правый край сообщения
- Появление: slide-in справа (translateX) вместо мгновенного display:flex
- Добавить reaction quick-picker (3 популярных эмодзи)

### 2.4 Реакции — увеличенные кнопки
**Файл:** `ui/components/features/messaging/elements/Reactions.tsx`
- "+" кнопка: opacity 0.5 по умолчанию (не 0), больше размер
- Hover на реакцию: scale(1.1) + shadow
- Тултип: показывать список пользователей сразу (без задержки)

### 2.5 Embed стилизация — современная
**Файл:** `ui/components/features/messaging/elements/TextEmbed.tsx`
- Заменить solid primary-container фон на outline border стиль
- Тонкая левая полоска (3px) + прозрачный фон + легкая тень
- Более крупное превью изображения (до 300px вместо 120px)

---

## Phase 3: Voice/Video Modernization (5-7 дней)

### 3.1 Dynamic Speaker Focus
**Файл:** `VoiceCallCardActiveRoom.tsx`
- Говорящий участник получает увеличенный тайл (2x размер в грид)
- CSS Grid: `grid-column: span 2` для активного спикера
- Плавный переход при смене говорящего (300ms)
- Индикатор громкости: зелёная полоска внизу тайла (высота ~ громкость)

### 3.2 Screen Share как Main View
**Файл:** `VoiceCallCardActiveRoom.tsx`
- При наличии screen share: layout перестраивается:
  - Screen share: 70% ширины (main view)
  - Камеры: strip справа (30%, вертикальный скролл)
- Кнопка "Развернуть" для полноэкранного режима

### 3.3 Audio Visualizer
**Новый файл:** `ui/components/features/voice/AudioVisualizer.tsx`
- Полоски громкости под каждым участником (4-6 bars)
- CSS анимация на основе `useIsSpeaking()` + аудио уровня
- Стиль: зелёные bars (Discord-like)

### 3.4 Self-View PiP
**Файл:** `VoiceCallCardActiveRoom.tsx`
- Маленький preview своей камеры (120x68px) в правом нижнем углу
- Draggable позиция
- Двойной клик — развернуть в полный тайл
- Скруглённые углы + тень

### 3.5 Connection Quality Panel
**Файл:** `VoiceChannelPreview.tsx` + новый `ConnectionStats.tsx`
- Hover на quality bars → popup с деталями:
  - Ping (ms), Bitrate (kbps), Packet loss (%), Codec
- Цвет: зелёный/жёлтый/красный по порогам

---

## Phase 4: Mobile & Responsive (3-5 дней)

### 4.1 Media Queries
**Файлы:** Глобальные стили + layout компоненты

| Брейкпоинт | Устройство | Layout |
|-------------|-----------|--------|
| < 480px | Телефон | Полноэкранный контент, нет сайдбаров |
| 480-768px | Планшет portrait | Свайп сайдбар |
| 768-1024px | Планшет landscape | Компактный сайдбар |
| > 1024px | Десктоп | Полный layout |

### 4.2 Свайп-навигация
**Файл:** `Interface.tsx`, `Sidebar.tsx`
- Свайп вправо → открыть сайдбар
- Свайп влево → закрыть сайдбар
- Touch event handlers с velocity detection
- Плавная анимация translate

### 4.3 Мобильный Voice UI
**Файл:** `VoiceBottomBar.tsx`
- Полноэкранный overlay при подключении к голосу
- Большие кнопки управления (48px минимум)
- Swipe down для сворачивания в mini-bar

### 4.4 Touch-оптимизация
- Минимальный touch target: 48px (сейчас некоторые 32px)
- Долгое нажатие = контекстное меню
- Pull-to-refresh в списке сообщений

---

## Phase 5: Polish & Consistency (2-3 дня)

### 5.1 Унификация анимаций
- Стандартизировать: все transitions через `--transitions-fast/medium/slow`
- Убрать хардкод `0.15s`, `0.17s`, `100ms` → токены
- Единый easing: `cubic-bezier(0.2, 0, 0, 1)`

### 5.2 Focus-visible для клавиатуры
**Файлы:** `MenuButton.tsx`, `Button.tsx`, `IconButton.tsx`
- `:focus-visible` стиль: 2px primary outline + offset
- Tab-навигация по серверам, каналам, сообщениям

### 5.3 Удаление legacy токенов
**Файл:** `legacyThemeGeneratorCode.ts`
- Удалить файл целиком (400+ строк deprecated кода)
- Убрать генерацию `--colours-*` переменных
- 0 компонентов их используют (уже проверено)

### 5.4 Settings поиск
**Файл:** `UserSettings.tsx`, `ServerSettings.tsx`
- Поисковая строка вверху настроек
- Фильтрация категорий по запросу
- Подсветка найденного

### 5.5 Skeleton для профиля
**Файл:** `floating/UserCard.tsx`
- Skeleton при загрузке: баннер, аватар, текст с шиммером

---

## Phase 6: Advanced Features (5-10 дней, опционально)

### 6.1 Picture-in-Picture mode
- Вынос видео в отдельное окно (PiP API)

### 6.2 Theater/Gallery mode toggle
- Gallery: текущая сетка (все равны)
- Theater: один большой + strip маленьких
- Speaker: автофокус на говорящем

### 6.3 Hand Raise
- Кнопка в VoiceBottomBar
- Иконка над аватаром участника

### 6.4 Message density modes
- Cozy: 16px spacing, аватары 40px
- Compact: 4px spacing, аватары 20px, inline timestamps
- Переключатель в настройках

### 6.5 MDUI → styled-system миграция
- Заменить `mdui-select`, `mdui-checkbox`, `mdui-radio`
- Свои компоненты на Panda CSS

---

## Приоритеты

| Phase | Усилие | Визуальный эффект | Приоритет |
|-------|--------|-------------------|-----------|
| 1. Quick Wins | 1-2 дня | Высокий | **P0** |
| 2. Core UX | 3-5 дней | Очень высокий | **P0** |
| 3. Voice/Video | 5-7 дней | Высокий | **P1** |
| 4. Mobile | 3-5 дней | Критичный для mobile | **P1** |
| 5. Polish | 2-3 дня | Средний | **P2** |
| 6. Advanced | 5-10 дней | Средний | **P3** |

---

## Порядок реализации

```
Week 1: Phase 1 (Quick Wins) + Phase 2.1-2.2 (Тосты + Иконки меню)
Week 2: Phase 2.3-2.5 (Тулбар + Реакции + Embeds) + Phase 3.1 (Speaker Focus)
Week 3: Phase 3.2-3.5 (Voice полностью) + Phase 4.1 (Media Queries)
Week 4: Phase 4.2-4.4 (Mobile) + Phase 5 (Polish)
Week 5+: Phase 6 (Advanced, по желанию)
```

---

## Сравнение с Discord (текущее состояние → цель)

| Компонент | PLG Voice сейчас | Discord | После V6 |
|-----------|-----------------|---------|----------|
| Загрузка | Спиннер | Скелетоны | Скелетоны |
| Тосты | Нет | Есть (4 типа) | Есть (4 типа) |
| Контекстное меню | Плоское, без иконок | Иконки + шорткаты | Иконки + шорткаты |
| Код-блоки | Хардкод тёмная тема | Адаптивные | Адаптивные |
| Typing | Текст | Анимированные точки | Анимированные точки |
| Voice тайлы | Все равные | Фокус на спикере | Фокус на спикере |
| Screen share | В общей сетке | Main view | Main view |
| Audio визуализация | Нет | Зелёные bars | Зелёные bars |
| Mobile | Нет | Полная адаптация | Media queries + свайп |
| Self-view | В общей сетке | PiP | PiP |
| Hover эффекты | Плоские | Тени + scale | Тени + scale |
| Клавиатурная навигация | Частичная | Полная | Focus-visible |

---

## Метрики успеха

- [ ] Все загрузки с skeleton анимацией
- [ ] Тосты заменяют alert() и браузерные уведомления для действий
- [ ] Контекстные меню с иконками и шорткатами
- [ ] Voice: говорящий выделен, screen share увеличен
- [ ] Мобильное использование возможно (сайдбар свайпом)
- [ ] 0 хардкодов цветов (всё через токены)
- [ ] 0 legacy `--colours-*` токенов
- [ ] Все кнопки имеют focus-visible стиль
- [ ] Typing indicator с анимированными точками
