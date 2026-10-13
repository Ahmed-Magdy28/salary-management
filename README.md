# Salary Management

Employee salary management for an organization of 10,000 people. See `docs/` for requirements and user stories.

## Quick start (work in progress)

```bash
docker compose up -d        # PostgreSQL
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```
