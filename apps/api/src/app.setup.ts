import type { INestApplication } from "@nestjs/common";

/** WEB_ORIGIN may hold several origins separated by commas (e.g. production and preview URLs). */
export function parseOrigins(value: string | undefined): string[] {
  const origins = (value ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return origins.length > 0 ? origins : ["http://localhost:3000"];
}

/** Shared by main.ts and the e2e tests so both run the same configuration. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix("api");
  app.enableCors({ origin: parseOrigins(process.env.WEB_ORIGIN) });
}
