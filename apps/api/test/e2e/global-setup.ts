import { execSync } from "node:child_process";
import path from "node:path";
import { Client } from "pg";
import { assertIsTestDatabase, getTestDatabaseUrl } from "./test-db";

const REPO_ROOT = path.resolve(__dirname, "../../../..");

/**
 * Runs once before the e2e suites: creates the test database if it is missing
 * and brings its schema up to date, so `pnpm test:e2e` works on a fresh machine.
 * Set E2E_SKIP_MIGRATE=1 if you manage the schema yourself.
 */
export default async function globalSetup(): Promise<void> {
  const url = getTestDatabaseUrl();
  const name = assertIsTestDatabase(url);

  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const found = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (found.rowCount === 0) {
      await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
      console.log(`\nCreated database "${name}"`);
    }
  } finally {
    await client.end();
  }

  if (process.env.E2E_SKIP_MIGRATE === "1") return;
  execSync("pnpm --filter @salary/db migrate:deploy", {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
