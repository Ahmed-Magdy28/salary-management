# Deployment guide

| Part | Service | Notes |
|------|---------|-------|
| Database | [Neon](https://neon.tech) PostgreSQL | Project `salary-management` |
| API | [Railway](https://railway.com) | Builds from GitHub, runs migrations and the first seed on deploy |
| Web | [Vercel](https://vercel.com) | Next.js, root directory `apps/web` |

Railway and Vercel both deploy from a GitHub repository, so push the code first.

## 0. Check locally first

```bash
docker compose up -d && cp .env.example .env && pnpm install
pnpm --filter @salary/db generate && pnpm --filter @salary/shared build
pnpm db:migrate        # should apply 20261014000000_init with no drift warning
```

If Prisma reports drift, delete `packages/db/prisma/migrations/20261014000000_init`, run `pnpm db:migrate -- --name init`, and commit the result.

## 1. Push to GitHub

```bash
git remote add origin https://github.com/<you>/salary-management.git
git push -u origin main
```

Install the Railway and Vercel GitHub apps on that repository when they ask.

## 2. Database on Neon

Use the **direct** connection string (host without `-pooler`), with only `?sslmode=require`:

```
postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/salary?sslmode=require
```

Remove `channel_binding=require` if the string has it. Never commit this string.

## 3. API on Railway

1. New project, deploy from the GitHub repo (root directory = repository root).
2. Variables:
   - `DATABASE_URL`: the Neon string above
   - `WEB_ORIGIN`: your Vercel URL (set after step 4; several origins can be separated by commas)
3. Settings:
   - Build command: `pnpm install --frozen-lockfile --prod=false && pnpm turbo run build --filter=@salary/api && pnpm --filter @salary/db migrate:deploy && pnpm --filter @salary/db seed:if-empty`
   - Start command: `node apps/api/dist/main.js`
   - Health check path: `/api/health`
   - Generate a public domain.
4. The build creates the tables (`migrate deploy`) and loads the 10,000 employees only if the table is empty, so redeploys never wipe data.
5. Open `https://<railway-domain>/api/health`; it should return `{"status":"ok","database":"up"}`.

## 4. Web on Vercel

1. Import the repo. **Root Directory:** `apps/web`, with **Include source files outside of the Root Directory** turned on.
2. Environment variable (needed at build time): `NEXT_PUBLIC_API_URL` = `https://<railway-domain>/api`
3. Deploy. `apps/web/vercel.json` sets the install and build commands.
4. Put the Vercel URL into Railway's `WEB_ORIGIN` and redeploy the API.

## 5. Check it works

- [ ] `/api/health` returns ok
- [ ] Employees page shows 50 rows and about 9,670 active employees across 8 countries
- [ ] Search "an", filter by Germany, sort by salary
- [ ] Add, edit, deactivate and reactivate an employee
- [ ] Import from Excel: upload `apps/web/test/fixtures/employees.xlsx` (2 ready, 1 problem row), import, upload again (everyone skipped)
- [ ] Insights shows 8 countries; Pay spread shows a histogram

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Browser console shows a CORS error | `WEB_ORIGIN` does not match the Vercel URL exactly (no path, no trailing slash needed) |
| Pages say "Cannot reach the server" | `NEXT_PUBLIC_API_URL` was set after the web build (redeploy it), or it is missing `/api` |
| Build fails at `migrate deploy` | `DATABASE_URL` missing or wrong; use the direct Neon URL with `sslmode=require` |
| `P3005` database schema is not empty | Tables were created by hand. Run `prisma migrate resolve --applied 20261014000000_init` once |
| Employees list empty | The seed step did not run (check the build logs) |

## Alternative: Render

`render.yaml` is a Blueprint for the API on Render with the same build steps.
