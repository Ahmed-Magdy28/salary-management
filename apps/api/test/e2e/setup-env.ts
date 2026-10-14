// Runs before each e2e test file: point the app at the test database.
import { assertIsTestDatabase, getTestDatabaseUrl } from "./test-db";

const url = getTestDatabaseUrl();
assertIsTestDatabase(url);
process.env.DATABASE_URL = url;
