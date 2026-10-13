# Salary Management

Web app for an HR Manager to manage salaries for 10,000 employees across countries and to answer "how do we pay people?".

Docs: [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) · [`docs/USER_STORIES.md`](docs/USER_STORIES.md)

## Stack

Turborepo + pnpm monorepo

| Workspace | What |
|-----------|------|
| `apps/web` | Next.js, Tailwind, TanStack Query *(next milestone)* |
| `apps/api` | NestJS on Express, REST under `/api` |
| `packages/db` | Prisma schema and migrations, Prisma client factory, Faker seed script |
| `packages/shared` | Zod schemas, DTO types, constants shared by web and api |

## Quick start

```bash
docker compose up -d        # PostgreSQL 16 only (apps run locally)
cp .env.example .env
pnpm install
pnpm --filter @salary/db generate
pnpm db:migrate             # applies prisma/migrations
pnpm db:seed                # 10,000 employees, ~3 s, reproducible
pnpm test                   # unit tests, no database needed
pnpm --filter @salary/api test:e2e   # API tests, need the test database
```

Create the test database once: `docker compose exec db createdb -U postgres salary_test`, then apply the migration to it with `DATABASE_URL=<test url> pnpm --filter @salary/db migrate:deploy`.
Run the API with `pnpm --filter @salary/api dev` (http://localhost:4000/api).

Seed options: `SEED_COUNT` (default 10000) and `SEED_VALUE` (default 20261014) environment variables.

## Decisions

- **Money:** salary is a whole-number integer in the employee's local currency (no floats, no cents). Insights are always per currency.
- **Prisma client:** uses the `pg` driver adapter (`engineType = "client"`), so there is no native query engine to download.
- **Seed:** deterministic. The same seed value always produces the same 10,000 people, so demos and tests are repeatable.
- **Validation:** one Zod schema in `packages/shared` is used by both the API and the UI forms.

## API

| Method and path | Purpose |
|-----------------|---------|
| `GET /api/employees` | List with `search`, `country`, `department`, `jobTitle`, `status`, `minSalary`, `maxSalary` (needs `country`), `sortBy` (`fullName`, `salary`, `hireDate`), `sortOrder`, `page`, `pageSize` |
| `POST /api/employees` | Create (validated by the shared Zod schema; 400 with field errors, 409 on duplicate email) |
| `GET /api/employees/:id` | Read one (404 if missing) |
| `PATCH /api/employees/:id` | Partial update |
| `PATCH /api/employees/:id/status` | Deactivate or reactivate |
| `GET /api/insights/overview` | Headline counts for active employees |
| `GET /api/insights/salary-stats?groupBy=country\|department\|jobTitle&country=` | count, min, P25, median, mean, P75, max per group. `department` and `jobTitle` need a `country` so currencies are never mixed |
| `GET /api/insights/distribution?country=&jobTitle=&bands=10` | Histogram bands plus summary |
| `GET /api/meta/filters` | Options for filter dropdowns |
| `GET /api/health` | Liveness and database check |

Percentiles use PostgreSQL `percentile_cont`; histogram bands use `width_bucket`. At 10,000 rows every endpoint answers in well under 300 ms locally.
