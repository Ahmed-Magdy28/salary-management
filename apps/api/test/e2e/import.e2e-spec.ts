import request from "supertest";
import { createTestApp, employee, insertEmployees, type TestApp } from "./app";

const toRow = (row: number, overrides: Record<string, unknown> = {}) => ({
  row,
  data: { ...employee({ fullName: `Person ${row}`, email: `p${row}@acme.example`, salary: 50000 + row }), ...overrides },
});

describe("Employee import API (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<TestApp["app"]["getHttpServer"]>;

  beforeAll(async () => {
    ctx = await createTestApp();
    http = ctx.app.getHttpServer();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await ctx.prisma.client.employee.deleteMany();
  });

  it("imports valid rows and reports the rest with their row numbers", async () => {
    await insertEmployees(ctx.prisma, [employee({ email: "taken@acme.example" })]);

    const res = await request(http)
      .post("/api/employees/import")
      .send({
        rows: [
          toRow(2),
          toRow(3, { email: "taken@acme.example" }),
          toRow(4, { salary: 0 }),
          toRow(5, { email: "p2@acme.example" }),
          toRow(6),
        ],
      })
      .expect(200);

    expect(res.body.total).toBe(5);
    expect(res.body.created).toBe(2);
    expect(res.body.failed.map((f: { row: number }) => f.row)).toEqual([3, 4, 5]);
    expect(res.body.failed[0].errors[0].message).toBe("An employee with this email already exists");
    expect(res.body.failed[1].errors[0]).toEqual({ path: "salary", message: "Salary must be greater than 0" });
    expect(res.body.failed[2].errors[0].message).toBe("Same email as row 2 in this file");

    expect(await ctx.prisma.client.employee.count()).toBe(3);
  });

  it("is safe to run twice: the second run skips everyone as already existing", async () => {
    const body = { rows: [toRow(2), toRow(3)] };
    await request(http).post("/api/employees/import").send(body).expect(200);
    const again = await request(http).post("/api/employees/import").send(body).expect(200);
    expect(again.body.created).toBe(0);
    expect(again.body.failed).toHaveLength(2);
    expect(await ctx.prisma.client.employee.count()).toBe(2);
  });

  it("accepts a payload larger than the default 100 kB body limit", async () => {
    const rows = Array.from({ length: 3000 }, (_, i) => toRow(i + 2));
    expect(JSON.stringify({ rows }).length).toBeGreaterThan(300_000);
    const res = await request(http).post("/api/employees/import").send({ rows }).expect(200);
    expect(res.body).toMatchObject({ total: 3000, created: 3000, failed: [] });
  });

  it("imported people appear in the list and in insights", async () => {
    await request(http).post("/api/employees/import").send({ rows: [toRow(2), toRow(3)] }).expect(200);
    const list = await request(http).get("/api/employees?country=DE").expect(200);
    expect(list.body.total).toBe(2);
    const stats = await request(http).get("/api/insights/salary-stats?groupBy=country").expect(200);
    expect(stats.body[0]).toMatchObject({ group: "DE", count: 2 });
  });

  it("rejects an empty file and too many rows with 400", async () => {
    await request(http).post("/api/employees/import").send({ rows: [] }).expect(400);
    const rows = Array.from({ length: 10_001 }, (_, i) => ({ row: i + 2, data: {} }));
    await request(http).post("/api/employees/import").send({ rows }).expect(400);
  });

  it("does not treat 'import' as an employee id", async () => {
    await request(http).get("/api/employees/import").expect(404);
  });
});
