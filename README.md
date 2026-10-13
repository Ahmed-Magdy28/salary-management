# Salary Management

Web app for an HR Manager to manage salaries for 10,000 employees across countries and to answer "how do we pay people?".

Docs: [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) · [`docs/USER_STORIES.md`](docs/USER_STORIES.md)

## Stack

Turborepo + pnpm monorepo

| Workspace | What |
|-----------|------|
| `apps/web` | Next.js, Tailwind, TanStack Query *(next milestone)* |
| `apps/api` | NestJS on Express *(next milestone)* |
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
pnpm test
```

Seed options: `SEED_COUNT` (default 10000) and `SEED_VALUE` (default 20261014) environment variables.

## Decisions

- **Money:** salary is a whole-number integer in the employee's local currency (no floats, no cents). Insights are always per currency.
- **Prisma client:** uses the `pg` driver adapter (`engineType = "client"`), so there is no native query engine to download.
- **Seed:** deterministic. The same seed value always produces the same 10,000 people, so demos and tests are repeatable.
- **Validation:** one Zod schema in `packages/shared` is used by both the API and the UI forms.
