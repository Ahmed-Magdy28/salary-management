# Salary Management

Web app for an HR Manager to manage salaries for 10,000 employees across countries and to answer "how do we pay people?".

Docs: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) · [`docs/USER_STORIES.md`](docs/USER_STORIES.md) · [`docs/DESIGN_NOTES.md`](docs/DESIGN_NOTES.md) · [`docs/wireframes`](docs/wireframes/README.md)

## Stack

Turborepo + pnpm monorepo

| Workspace | What |
|-----------|------|
| `apps/web` | Next.js (App Router), Tailwind, TanStack Query, Recharts, shadcn-style components |
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

The e2e command creates the `salary_test` database and applies the migrations by itself (it refuses to run against any database whose name does not contain "test"). Set `TEST_DATABASE_URL` to use a different one.
Run everything with `pnpm dev`, or separately: API `pnpm --filter @salary/api dev` (http://localhost:4000/api) and web `pnpm --filter @salary/web dev` (http://localhost:3000).

Seed options: `SEED_COUNT` (default 10000) and `SEED_VALUE` (default 20261014) environment variables.

## Screens

- **Employees** (`/employees`): search, filters, salary range, sort, pagination, add, edit, deactivate. Filters live in the URL.
- **Add / edit** (`/employees/new`, `/employees/:id/edit`): one form, validated with the shared schema.
- **Insights** (`/insights`): headline counts and min / P25 / median / mean / P75 / max by country, department or job title.
- **Pay spread** (`/pay-spread`): salary histogram for a country and optional job title.

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

## Deployment

Neon (Postgres) + Render (API) + Vercel (web). Step-by-step guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). CI runs build, typecheck, unit and e2e tests on every push (`.github/workflows/ci.yml`).

Useful scripts without a `.env` file (the platform provides `DATABASE_URL`): `pnpm db:migrate:deploy` and `pnpm db:seed:ci`.

## Performance notes

- The API answers every endpoint in about 6 to 40 ms at 10,000 rows (list, search, filters, percentiles, distribution).
- `pnpm dev` compiles each page the first time you open it, so first visits feel slow. Judge real speed with a production build:
  `pnpm --filter @salary/web build && pnpm --filter @salary/web start`.
- The chart library loads only on the Pay spread page, the confirm dialog loads after the page, filter changes update the URL without a server round trip, and table rows do not re-render when a dialog opens.
- Browser extensions such as Grammarly add attributes to the page and can slow large tables and forms. Test in a private window if something feels slow. The app ignores extension-added attributes on `<html>` and `<body>` so React does not discard the server-rendered page.
