# Salary Management Tool: Requirements

**Persona:** HR Manager at ACME (10,000 employees, multiple countries)

## Goal
HR manages salaries in Excel, which is slow, error-prone, and makes questions like "how do we pay engineers in Germany vs India?" a manual exercise. Build a web app where the HR Manager can **maintain salary records reliably** and **answer pay questions in seconds**.

**Success:** find and edit an employee in under 30 s; list and insight endpoints under 300 ms (p95) at 10k records; seed loads 10k employees in under 30 s, reproducibly.

## Scope & Features
1. **Employee CRUD**: name, email, job title, department, country, currency, salary, hire date, status (soft delete via status).
2. **Search, filter, sort, paginate** server-side (name/email, country, department, job title, salary range).
3. **Insights dashboard**: headcount, min / median / mean / max, P25/P75, grouped by country, department, job title.
4. **Pay-spread view**: salary histogram for a country and optional job title, to spot outliers.
5. **Validation**: one shared schema for API and UI (required fields, positive salary, valid country/currency, unique email).
6. **Seed script**: 10,000 realistic employees across ~8 countries (fixed random seed).
7. **Import from Excel/CSV**: upload `.xlsx` or `.csv`, preview what is valid and what needs fixing, import the valid rows, skip people who already exist.
8. *Stretch:* cross-country USD comparison using a static rate table.

## Approach
- **Monorepo (Turborepo + pnpm):** `apps/web` (Next.js, Tailwind, TanStack Query, shadcn/ui, Recharts), `apps/api` (NestJS on Express), `packages/db` (Prisma schema, migrations, Faker seed), `packages/shared` (Zod schemas, types, constants).
- **Database:** PostgreSQL via a `docker-compose.yml` that runs only the DB. Median/percentiles use native `percentile_cont` through `$queryRaw`. Indexes on country, department, job title, email.
- **Currency:** salary stored in local currency as a whole-number integer (no cents, avoids float and 32-bit overflow in minor units). Insights are per country, so currencies are never silently mixed.
- **Testing:** Jest. Mostly DB-free unit tests (validation, filter building, seed output, stats mapping), plus a few Supertest API tests on a separate test database. Faker is seeded for determinism.
- **Deploy:** Vercel (web), Render/Railway (API), Neon (Postgres); plus a short demo video.

## Deliberately Left Out
| Item | Why |
|------|-----|
| Authentication / roles | One persona; adds effort, not core value. First v2 item. |
| Live Excel sync, export to Excel | Import is a one-time move off Excel; keeping two sources of truth would recreate the original problem. Export is a natural next step. |
| Payroll, tax, payslips | Different problem (paying people vs. analyzing pay). |
| Bonuses, equity, benefits | Base salary keeps the model and insights unambiguous. |
| Live FX rates | External dependency; makes numbers non-deterministic. |
| Approvals, audit and salary history | Valuable, but not needed to answer "how do we pay people". |
| HRIS integrations, org chart, i18n, multi-tenancy | Outside the stated problem. |

## Risks
- Prisma has no percentile API: use `percentile_cont` behind a typed, tested service.
- Slow seeding: use `createMany` in batches.
- Free-tier cold starts: warm the API before the demo.
- Scope creep: ship features 1 to 7 first, 8 only if time remains.
