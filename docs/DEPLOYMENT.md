# Deployment guide

Three free services, about 20 minutes:

| Part | Service | Why |
|------|---------|-----|
| Database | [Neon](https://neon.tech) (PostgreSQL) | Free, persistent, works with Prisma |
| API | [Render](https://render.com) web service | Builds from `render.yaml`, no Dockerfile needed |
| Web | [Vercel](https://vercel.com) | Native Next.js hosting |

Push the repo to GitHub first.

## 0. Check locally first

Before deploying, make sure the migration is accepted by Prisma on your machine:

```bash
docker compose up -d && cp .env.example .env && pnpm install
pnpm db:migrate        # should say "already in sync" or apply 20261014000000_init with no drift warning
```

If Prisma reports drift, delete `packages/db/prisma/migrations/20261014000000_init`, then run `pnpm db:migrate -- --name init` and commit the result.

## 1. Database on Neon

1. Create a project and copy the **direct** (non-pooled) connection string. It ends with `?sslmode=require`.
2. From your laptop, create the tables and load the 10,000 employees:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
pnpm db:migrate:deploy
pnpm db:seed:ci          # about 3 s; safe to re-run, it resets the table
```

If the API cannot connect, remove `&channel_binding=require` from the URL.

## 2. API on Render

1. Render dashboard: **New > Blueprint**, pick the GitHub repo. It reads `render.yaml`.
2. Set the environment variables when asked:
   - `DATABASE_URL`: the Neon string from step 1
   - `WEB_ORIGIN`: leave a placeholder for now (set in step 4)
3. Deploy. The build runs install, build and `migrate deploy`; the health check is `/api/health`.
4. Note the URL, for example `https://salary-api.onrender.com`. Open `/api/health`; it should return `{"status":"ok","database":"up"}`.

The free plan sleeps after about 15 minutes idle, so the first request after a pause can take 30 to 60 seconds. Open the health URL before a demo to wake it.

## 3. Web on Vercel

1. **Add New > Project**, import the repo.
2. **Root Directory:** `apps/web`. Turn on **Include source files outside of the Root Directory**.
3. Environment variable (must be set before the build, it is baked in):
   - `NEXT_PUBLIC_API_URL` = `https://salary-api.onrender.com/api`
4. Deploy. `apps/web/vercel.json` sets the install and build commands.

## 4. Connect them

On Render, set `WEB_ORIGIN` to your Vercel URL (for several origins, separate them with commas, for example the production and preview URLs). Render redeploys automatically.

## 5. Check it works

- [ ] `<api>/api/health` returns ok
- [ ] Employees page shows 50 rows and "9,670 active employees across 8 countries" (the exact count is after the 3% inactive share)
- [ ] Search "an", filter by Germany, sort by salary
- [ ] Add an employee, edit the salary, deactivate and reactivate
- [ ] Insights shows 8 countries with medians; Pay spread shows a histogram

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Browser console shows a CORS error | `WEB_ORIGIN` on Render does not match the Vercel URL exactly (no path) |
| Pages show "Cannot reach the server" | `NEXT_PUBLIC_API_URL` was set after the build; redeploy the web app. Or the API is waking up |
| API build fails at `migrate deploy` | `DATABASE_URL` missing or wrong on Render |
| `P1001` can't reach database | Use the direct Neon URL with `sslmode=require` |
| Employees list empty | The seed did not run against the production database |
