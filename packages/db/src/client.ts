import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Creates a Prisma client backed by the `pg` driver adapter.
 * `?schema=` in the URL is honoured, because the adapter takes it as an option.
 */
export function createPrismaClient(connectionString: string | undefined = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const url = new URL(connectionString);
  const schema = url.searchParams.get("schema") ?? undefined;
  url.searchParams.delete("schema");
  const adapter = new PrismaPg({ connectionString: url.toString() }, schema ? { schema } : undefined);
  return new PrismaClient({ adapter });
}
