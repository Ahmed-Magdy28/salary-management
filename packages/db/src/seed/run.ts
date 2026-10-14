import { createPrismaClient } from "../client";
import { DEFAULT_COUNT, DEFAULT_SEED, generateEmployees } from "./generator";

const BATCH_SIZE = 1000;

async function main(): Promise<void> {
  const count = Number(process.env.SEED_COUNT ?? DEFAULT_COUNT);
  const seed = Number(process.env.SEED_VALUE ?? DEFAULT_SEED);
  const onlyIfEmpty = process.argv.includes("--if-empty");
  const prisma = createPrismaClient();
  const started = Date.now();

  try {
    if (onlyIfEmpty && (await prisma.employee.count()) > 0) {
      console.log("Employees already exist, skipping seed (--if-empty).");
      return;
    }
    const employees = generateEmployees(count, seed);
    await prisma.employee.deleteMany();

    for (let offset = 0; offset < employees.length; offset += BATCH_SIZE) {
      const batch = employees.slice(offset, offset + BATCH_SIZE).map((e) => ({
        ...e,
        hireDate: new Date(`${e.hireDate}T00:00:00Z`),
      }));
      await prisma.employee.createMany({ data: batch });
    }

    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`Seeded ${employees.length} employees in ${seconds}s (seed ${seed}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
