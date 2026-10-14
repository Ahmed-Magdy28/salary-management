FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app

# Copy lockfile, workspace configuration, and configs
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig*.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/db/tsconfig*.json ./packages/db/
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig*.json apps/api/nest-cli.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source packages
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build shared packages and api
RUN pnpm turbo run build --filter=@salary/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy full application structure from builder
COPY --from=builder /app ./

EXPOSE 4000

# Run migrations against database, seed if empty, and start the API
CMD ["sh", "-c", "pnpm --filter @salary/db migrate:deploy && pnpm --filter @salary/db seed:if-empty && node apps/api/dist/main.js"]
