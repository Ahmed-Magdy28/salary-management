import { PrismaService } from "../prisma/prisma.service";
import { EmployeeImportService } from "./employee-import.service";

const row = (n: number, email: string, extra: Record<string, unknown> = {}) => ({
  row: n,
  data: {
    fullName: `Person ${n}`,
    email,
    jobTitle: "Software Engineer",
    department: "Engineering",
    country: "DE",
    currency: "EUR",
    salary: 60000 + n,
    hireDate: "2021-03-15",
    ...extra,
  },
});

function build(existingEmails: string[]) {
  const createMany = jest.fn().mockImplementation(({ data }: { data: unknown[] }) => ({ __op: "createMany", count: data.length }));
  const findMany = jest.fn().mockResolvedValue(existingEmails.map((email) => ({ email })));
  const $transaction = jest.fn().mockImplementation(async (ops: { count: number }[]) => ops.map((o) => ({ count: o.count })));
  const prisma = { client: { employee: { findMany, createMany }, $transaction } } as unknown as PrismaService;
  return { service: new EmployeeImportService(prisma), createMany, findMany, $transaction };
}

describe("EmployeeImportService", () => {
  it("creates valid rows and reports every kind of failure with its row", async () => {
    const { service, createMany } = build(["taken@acme.example"]);
    const result = await service.importEmployees({
      rows: [
        row(2, "new@acme.example"),
        row(3, "taken@acme.example"),
        row(4, "bad", { salary: -1 }),
        row(5, "new@acme.example"),
        row(6, "another@acme.example"),
      ],
    });

    expect(result.total).toBe(5);
    expect(result.created).toBe(2);
    expect(result.failed.map((f) => f.row)).toEqual([3, 4, 5]);
    expect(result.failed[0].errors[0].message).toBe("An employee with this email already exists");
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createMany.mock.calls[0][0].skipDuplicates).toBe(true);
    expect(createMany.mock.calls[0][0].data[0].hireDate).toEqual(new Date("2021-03-15T00:00:00Z"));
  });

  it("does not touch the database when every row is invalid", async () => {
    const { service, $transaction } = build([]);
    const result = await service.importEmployees({ rows: [row(2, "x", { salary: 0 })] });
    expect(result).toMatchObject({ total: 1, created: 0 });
    expect($transaction).not.toHaveBeenCalled();
  });

  it("inserts large files in batches of 1,000 inside one transaction", async () => {
    const { service, createMany, $transaction } = build([]);
    const rows = Array.from({ length: 2500 }, (_, i) => row(i + 2, `p${i}@acme.example`));
    const result = await service.importEmployees({ rows });
    expect(result.created).toBe(2500);
    expect(createMany).toHaveBeenCalledTimes(3);
    expect($transaction).toHaveBeenCalledTimes(1);
  });
});
