import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { configureApp } from "../../src/app.setup";
import { PrismaService } from "../../src/prisma/prisma.service";

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export interface EmployeeSeed {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salary: number;
  hireDate: string;
  status?: "ACTIVE" | "INACTIVE";
}

export function employee(overrides: Partial<EmployeeSeed> = {}): EmployeeSeed {
  return {
    fullName: "Lena Fischer",
    email: "lena.fischer@acme.example",
    jobTitle: "Software Engineer",
    department: "Engineering",
    country: "DE",
    currency: "EUR",
    salary: 72000,
    hireDate: "2021-03-15",
    ...overrides,
  };
}

export async function insertEmployees(prisma: PrismaService, rows: EmployeeSeed[]): Promise<void> {
  await prisma.client.employee.createMany({
    data: rows.map((r) => ({ ...r, hireDate: new Date(`${r.hireDate}T00:00:00Z`) })),
  });
}
