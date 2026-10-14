/** Connection string for the e2e database. Never the development database. */
export function getTestDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/salary_test?schema=public";
}

/** The e2e tests delete every row, so refuse any database that is not clearly a test one. */
export function assertIsTestDatabase(url: string): string {
  const name = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!/test/i.test(name)) {
    throw new Error(`Refusing to run e2e tests against "${name}": the database name must contain "test".`);
  }
  return name;
}
