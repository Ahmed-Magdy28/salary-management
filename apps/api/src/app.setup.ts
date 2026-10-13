import type { INestApplication } from "@nestjs/common";

/** Shared by main.ts and the e2e tests so both run the same configuration. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix("api");
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" });
}
