import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";

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
  // A 10,000-row spreadsheet import is a few MB of JSON; the default 100 kB limit is too small.
  (app as NestExpressApplication).useBodyParser("json", { limit: "5mb" });
  app.setGlobalPrefix("api");
  // maxAge lets browsers reuse the permission check for POST/PATCH instead of repeating it every time.
  app.enableCors({ origin: parseOrigins(process.env.WEB_ORIGIN), maxAge: 86400 });
}
