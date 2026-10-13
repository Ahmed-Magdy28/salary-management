// Runs before each e2e test file: point the app at the test database.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/salary_test?schema=public";
