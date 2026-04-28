# N-back Multiplayer

Соревновательный тренажёр рабочей памяти на основе классического теста **2-back**. Поддерживает одиночную тренировку и мультиплеер в реальном времени, где ошибки одного игрока ускоряют игру для всех.

## Что такое N-back

Игроку последовательно показывают стимулы (подсвечивается одна из 9 клеток сетки 3×3). Задача — нажимать **Match!**, когда текущая позиция совпадает с той, что была показана **N шагов назад**. В этом проекте используется `N = 2`.

- 20 стимулов за игру
- Стартовый интервал — 2.5 секунды на стимул
- Первые два стимула не учитываются (не с чем сравнивать)
- Правильный ответ: нажать на совпадении / промолчать на не-совпадении

## Возможности

### Одиночная игра (`/solo`)
- Последовательность стимулов генерируется на сервере
- Полностью клиентская логика игры — без сети, без задержек
- При нажатии «Play again» сервер генерирует новую последовательность

### Мультиплеер (`/game`)
- Лобби до 4 игроков, host управляет стартом
- Серверная генерация последовательности (одна на всю игру) — все игроки видят одинаковые стимулы
- Каждый ответ проходит валидацию через защищённую tRPC процедуру
- **Механика «общего ускорения»:** каждые 3 ошибки **любого** игрока ускоряют игру на 300 мс для всех (минимум — 700 мс)
- Авто-обновление лобби и страницы игры через `router.refresh()`
- При переподключении сервер автоматически "догоняет" пропущенные стимулы (`catchUpMissedAnswers`)

### История и таблица лидеров
- `/history` — все мультиплеерные матчи пользователя с финальными счётами и местами
- `/leaderboard` — игроки, отсортированные по winrate (тай-брейк: количество побед → суммарные очки)

## Технологический стек

| Слой           | Технология                                  |
| -------------- | ------------------------------------------- |
| Фреймворк      | Next.js 16 (App Router, Turbopack)          |
| Язык           | TypeScript, React 19                        |
| Стили          | Tailwind CSS v4 + shadcn/ui (Radix)         |
| База данных    | PostgreSQL (Neon serverless)                |
| ORM            | Drizzle ORM                                 |
| Аутентификация | better-auth (email + пароль)                |
| API            | tRPC v11 + TanStack Query                   |
| Тесты          | Vitest                                      |

## Структура проекта

```
src/
├── app/
│   ├── dashboard/           # Главная после входа
│   ├── solo/                # Одиночная тренировка
│   ├── game/                # Мультиплеер: список лобби, [gameId]
│   ├── history/             # История мультиплеер-матчей
│   ├── leaderboard/         # Таблица лидеров по winrate
│   ├── login/, signup/      # Страницы аутентификации
│   └── api/{auth,trpc}/     # API-роуты
├── components/
│   ├── game/                # SoloGame, Playing, Grid, Scoreboard, ...
│   └── ui/                  # shadcn-компоненты
├── server/
│   ├── routers/game.ts      # tRPC роутер
│   ├── game-service.ts      # submitAnswerForPlayer, catchUpMissedAnswers
│   └── trpc.ts              # protectedProcedure, контекст
├── game/                    # Чистая бизнес-логика
│   ├── sequence.ts          # generateSequence, computeCurrentStimulusIndex, isGameOver
│   └── scoring.ts           # evaluateAnswer, shouldTriggerSpeedChange, computeNextIntervalMs
├── db/                      # Drizzle: schema, drizzle client
└── lib/                     # auth, trpc-client, утилиты
tests/                       # Юнит-тесты бизнес-логики (Vitest)
```

## Бизнес-логика

Вся игровая логика вынесена в чистые функции в `src/game/` — без зависимостей от React, БД и сети. Это позволяет:
- Использовать одни и те же функции на сервере (валидация ответов) и клиенте (отображение текущего стимула)
- Покрыть всё юнит-тестами без моков

Ключевые функции:
- `generateSequence(length, n, matchProb=0.33)` — генерация последовательности стимулов
- `computeCurrentStimulusIndex(startedAt, intervalMs, speedChanges, count, now)` — детерминистский расчёт текущего стимула по времени
- `isGameOver(...)` — проверка окончания игры
- `evaluateAnswer(seq, n, idx, pressed)` — корректность ответа
- `shouldTriggerSpeedChange(errors, errorsAtLastChange)` — порог для ускорения
- `computeNextIntervalMs(current)` — следующий интервал (−300 мс, не ниже 700 мс)

## Схема БД

Основные таблицы:

- `user`, `session`, `account`, `verification` — better-auth
- `game` — состояние матча: `status` (lobby/playing/finished), `sequence` (jsonb), `started_at` (double precision), `speed_changes` (jsonb), параметры игры
- `game_players` — участники матча: `score`, `error_count`, `error_count_at_last_speed_change`
- `stimulus_answers` — каждый ответ игрока: `stimulus_index`, `pressed`, `correct` + unique-индекс `(game_id, user_id, stimulus_index)` против дублей

## Запуск локально

### Требования
- Node.js 20+
- Аккаунт Neon (или другой PostgreSQL)

### Установка

```bash
git clone <repo>
cd n_back
npm install
```

### Переменные окружения

В корне создать `.env`:

```
DATABASE_URL=postgres://...           # строка подключения Neon
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<длинная-случайная-строка>
```

### Миграции

```bash
npx drizzle-kit push          # синхронизирует схему с БД
```

### Запуск

```bash
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

> **Доступ из локальной сети.** Если открываешь dev-сервер с другого устройства (например, по `192.168.x.x`), Next.js 16 по умолчанию блокирует cross-origin запросы. Нужный IP уже добавлен в [`next.config.ts`](next.config.ts) → `allowedDevOrigins`.

## Тесты

```bash
npm test            # один прогон
npm run test:watch  # watch-режим
```

Покрыты все чистые функции из `src/game/` — включая краевые случаи (n=1, изменения скорости, разрывы по времени).

## Соответствие обязательным требованиям

| Требование                                              | Где                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| Серверная генерация последовательности                  | `src/game/sequence.ts` → `/game/start`, `/solo`                |
| Проверка ответов через защищённые процедуры             | `src/server/routers/game.ts` → `protectedProcedure submitAnswer` |
| Влияние ошибок одного игрока на всех                    | `shouldTriggerSpeedChange` + `speed_changes` в БД              |
| Поддержка нескольких игроков                            | Лобби до 4 игроков, общая последовательность, общий тайминг    |
| Хранение результатов                                    | Таблицы `game_players`, `stimulus_answers`                     |
| Тестирование бизнес-логики                              | `tests/scoring.test.ts`, `tests/sequence.test.ts` (22 теста)   |
