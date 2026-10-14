# Design notes and trade-offs

## Architecture
Turborepo + pnpm monorepo with four workspaces: `apps/web` (Next.js), `apps/api` (NestJS), `packages/db` (Prisma, seed) and `packages/shared` (Zod schemas, types, constants). Only schemas, types and constants are shared, to keep the monorepo cheap to run.

## Key decisions
| Decision | Why | Trade-off |
|----------|-----|-----------|
| One Zod schema in `packages/shared`, used by API and forms | Rules cannot drift between UI and API | Web and API depend on the shared package being built first (Turborepo handles it) |
| Salary as whole-number integer in local currency | No float errors, no 32-bit overflow in minor units (INR, JPY) | No cents; fine for annual salaries |
| Stats always in one currency; department and job title views need a country | Averaging INR with USD would be meaningless | HR cannot see a single org-wide average without the USD stretch feature |
| Percentiles via PostgreSQL `percentile_cont`, histogram via `width_bucket` | Exact results, computed next to the data, one query per view | Raw SQL (whitelisted column names) instead of Prisma's query builder |
| Filters, sort and paging in SQL, state kept in the URL | 10,000 rows never reach the browser; views are linkable | A little more plumbing than client-side filtering |
| Prisma with the `pg` driver adapter | No native engine to download or deploy | Needs Prisma 6.16+ |
| Deterministic seed (fixed Faker seed, fixed date window) | Same data every run, so tests and demos repeat | Data looks synthetic |
| Unit tests avoid the database; a small e2e suite uses a separate test DB | Fast feedback, but real SQL is still tested | e2e needs Postgres running |
| Soft delete through `status` | Keeps history and is reversible | Inactive rows stay in the table |

## Performance
At 10,000 seeded rows every endpoint answers in under 150 ms locally (list, search, filters, grouped percentiles, distribution). Indexes: unique email, (country, department), (country, jobTitle), department, status.

## Testing approach
- `packages/shared`: schema rules, including currency matching the country.
- `packages/db`: the seed generator is deterministic, unique, valid against the shared schema and realistic.
- `apps/api` unit: query building, mappers, band maths, service error translation (mocked Prisma).
- `apps/api` e2e: real HTTP against Postgres, including exact percentile values on known data.
- `apps/web`: URL filter state, formatting, form validation, pagination, form behaviour with server errors, chart band logic.

## How AI was used
Claude generated the requirements, user stories, wireframes and first drafts of the code. Every step was run: tests, a production build and timing checks against the seeded database. Several issues were found and fixed by that loop, for example the department view mixing currencies, an empty form showing a redundant currency error, and Turborepo dropping environment variables.

## Known gaps
- No authentication (out of scope, see requirements).
- Cross-country USD comparison (stretch) is not built.
- Deployment and the demo video are still to do.
