# Developer Profile API

Цифровая визитка на TypeScript, Node.js, NestJS, Apollo GraphQL, Prisma и PostgreSQL.
Данные: профиль Данилы Деренченко, навыки, опыт в CQG и Trading Order Widget.

## Запуск в Docker

```bash
docker compose up --build -d --wait
```

Откройте **http://localhost:4000/graphql** — Apollo Sandbox.
Миграции и заполнение базы выполняются автоматически перед запуском сервера.
Для Docker файл `.env` не нужен; требуются Docker Compose v2 и доступ к интернету
для первой сборки. Интерфейс Sandbox также загружает ресурсы из интернета.

```graphql
query {
  profile {
    name
    description
    links { label url }
    skills { name }
    experience {
      company
      position
      startDate
      endDate
      achievements
    }
    projects { name description url }
  }
}
```

Логи: `docker compose logs -f app`. Остановка: `docker compose down`.
Добавление `-v` удаляет базу. Если порты заняты:
`PORT=4001 DB_PORT=5435 docker compose up --build -d --wait`.

## Vercel

1. Сохраните изменения в GitHub и импортируйте репозиторий в Vercel.
   Framework Preset — **NestJS**, Node.js — **24.x**. Команды установки и сборки
   уже указаны в `vercel.json`; Output Directory оставьте без переопределения.
2. В Vercel откройте **Storage → Create Database → Neon** и подключите базу
   к проекту через **Connect Project**. Интеграция добавит переменные окружения:

   | Переменная | Назначение |
   | --- | --- |
   | `DATABASE_URL` | Подключение приложения через пул Neon |
   | `DATABASE_URL_UNPOOLED` | Прямое подключение для миграций; необязательно |

3. Запустите **Redeploy** после подключения базы. Если первый деплой прошёл без
   переменных БД, его сборка завершится ошибкой — повторите после их добавления.
4. Откройте `https://<ваш-проект>.vercel.app/graphql`. Корень сайта перенаправляет
   на Apollo Sandbox.

Vercel запускает NestJS через `src/main.ts`. Команда `npm run build:vercel`
генерирует Prisma Client, компилирует TypeScript, применяет миграции и загружает
профиль. Подготовка БД выполняется при сборке, до приёма запросов.
Docker на Vercel не запускается: используйте внешнюю PostgreSQL-базу.

Для Preview используйте отдельную базу или включите **Preview Branching** у Neon:
каждая сборка применяет миграции и данные к БД из своих переменных окружения.
Пул подключений переиспользуется экземпляром NestJS; `attachDatabasePool`
управляет простаивающими соединениями при приостановке функции Vercel.

Документация: [NestJS на Vercel](https://vercel.com/docs/frameworks/backend/nestjs),
[подключение Neon](https://neon.com/docs/guides/vercel-managed-integration).

## Локальная разработка

Нужны Node.js 24 и PostgreSQL 16. Базу можно запустить через Docker:

```bash
cp .env.example .env # если файла ещё нет
npm ci
npm run db:up
npm run dev
```

Если Docker-приложение уже занимает порт 4000, выполните `docker compose stop app`.
`DATABASE_URL` задаёт подключение к БД, `PORT` — порт API (4000 по умолчанию),
`DB_PORT` — внешний порт PostgreSQL в Compose (5434). При изменении `DB_PORT`
обновите и локальный `DATABASE_URL`.

`dev` пересобирает приложение и обновляет данные при изменении исходников.
После изменения Prisma-схемы создайте миграцию и перезапустите `dev`.

| Команда | Назначение |
| --- | --- |
| `npm start` | Сборка, подготовка базы и запуск |
| `npm run db:seed` | Обновить данные профиля |
| `npm run db:migrate -- --name <name>` | Создать миграцию |
| `npm run db:studio` | Открыть Prisma Studio |
| `npm test` | Сборка и интеграционные тесты |

## Структура и данные

- `src/profile/` — GraphQL-схема, резолвер и сервис получения профиля со связями.
- `src/database/` — Prisma Client, подключение и закрытие соединений.
- `prisma/` — схема БД, миграции, seed и данные из резюме.
- `test/` — проверки API и заполнения базы с настоящим PostgreSQL.

Резолвер обращается к сервису, сервис загружает профиль через Prisma `include`.
Списки сортируются по порядку в файле данных. API доступен только для чтения.

Данные редактируются в [`prisma/profile-data.ts`](prisma/profile-data.ts).
Seed обновляет записи в одной транзакции: сохраняет ID при неизменных ключах,
удаляет убранные из файла записи и откатывает изменения при ошибке.
Уникальность записей и корректный порядок дат работы защищены ограничениями БД.
Ручные правки этого профиля в базе заменятся данными файла при следующем запуске.

Даты из резюме указаны до месяца, поэтому хранятся первым числом месяца.
В GraphQL они возвращаются в ISO 8601 UTC; `endDate: null` означает текущую работу.
У Trading Order Widget указана согласованная ссылка на сайт CQG: публичной ссылки
на сам виджет или репозиторий в резюме нет.

## Проверки

После запуска PostgreSQL выполните `npm test`. Тесты создают и удаляют отдельную
временную базу; пользователь из `DATABASE_URL` должен иметь право `CREATEDB`.
Проверяются запуск с нуля, вложенный GraphQL-запрос, Sandbox, повторный seed,
сохранение ID и откат при ошибке. GitHub Actions также проверяет Docker-запуск.

Два `overrides` в `package.json` обновляют уязвимые транзитивные зависимости
Prisma 7.10 (`deepmerge-ts` и `mysql2`). При обновлении Prisma их стоит пересмотреть.
