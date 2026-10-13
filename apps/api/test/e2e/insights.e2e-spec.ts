import request from "supertest";
import { createTestApp, employee, insertEmployees, type TestApp } from "./app";

const deSalaries = [50000, 60000, 70000, 80000, 90000, 100000];

describe("Insights and meta API (e2e)", () => {
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
    await insertEmployees(ctx.prisma, [
      ...deSalaries.map((salary, i) => employee({ fullName: `DE ${i}`, email: `de${i}@acme.example`, salary })),
      employee({ fullName: "DE Inactive", email: "deoff@acme.example", salary: 999999, status: "INACTIVE" }),
      employee({ fullName: "DE Finance", email: "defin@acme.example", salary: 40000, department: "Finance", jobTitle: "Accountant" }),
      employee({ fullName: "US One", email: "us1@acme.example", country: "US", currency: "USD", salary: 100000 }),
      employee({ fullName: "US Two", email: "us2@acme.example", country: "US", currency: "USD", salary: 140000 }),
    ]);
  });

  it("reports headline counts for active employees only", async () => {
    const res = await request(http).get("/api/insights/overview").expect(200);
    expect(res.body).toEqual({ employees: 9, countries: 2, departments: 2, jobTitles: 2 });
  });

  it("computes per-country statistics in local currency, excluding inactive staff", async () => {
    const res = await request(http).get("/api/insights/salary-stats?groupBy=country").expect(200);
    const de = res.body.find((r: { group: string }) => r.group === "DE");
    expect(de).toMatchObject({ currency: "EUR", count: 7, min: 40000, max: 100000 });
    const us = res.body.find((r: { group: string }) => r.group === "US");
    expect(us).toMatchObject({ currency: "USD", count: 2, min: 100000, median: 120000, mean: 120000, max: 140000 });
  });

  it("computes exact percentiles for a job title within a country", async () => {
    const res = await request(http).get("/api/insights/salary-stats?groupBy=jobTitle&country=DE").expect(200);
    const row = res.body.find((r: { group: string }) => r.group === "Software Engineer");
    // 50k..100k in 10k steps: p25 = 62,500, median = 75,000, p75 = 87,500
    expect(row).toMatchObject({ count: 6, min: 50000, p25: 62500, median: 75000, mean: 75000, p75: 87500, max: 100000, lowSample: false });
  });

  it("groups by department within one country and flags small groups", async () => {
    const res = await request(http).get("/api/insights/salary-stats?groupBy=department&country=DE").expect(200);
    expect(res.body.map((r: { group: string }) => r.group)).toEqual(["Engineering", "Finance"]);
    expect(res.body.find((r: { group: string }) => r.group === "Finance").lowSample).toBe(true);
  });

  it("refuses to mix currencies when no country is given", async () => {
    await request(http).get("/api/insights/salary-stats?groupBy=department").expect(400);
    await request(http).get("/api/insights/salary-stats?groupBy=jobTitle").expect(400);
  });

  it("builds a distribution whose band counts add up to the headcount", async () => {
    const res = await request(http).get("/api/insights/distribution?country=DE&jobTitle=Software%20Engineer&bands=5").expect(200);
    expect(res.body).toMatchObject({ country: "DE", currency: "EUR", jobTitle: "Software Engineer" });
    expect(res.body.summary).toMatchObject({ count: 6, median: 75000 });
    expect(res.body.bands.map((b: { count: number }) => b.count)).toEqual([2, 1, 1, 1, 1]);
    expect(res.body.bands[0].from).toBe(50000);
    expect(res.body.bands[4].to).toBe(100000);
  });

  it("returns an empty distribution when nobody matches", async () => {
    const res = await request(http).get("/api/insights/distribution?country=JP").expect(200);
    expect(res.body).toMatchObject({ summary: null, bands: [] });
  });

  it("requires a country for the distribution", async () => {
    await request(http).get("/api/insights/distribution").expect(400);
  });

  it("lists filter options including job titles found in the data", async () => {
    const res = await request(http).get("/api/meta/filters").expect(200);
    expect(res.body.countries).toHaveLength(8);
    expect(res.body.departments).toContain("Engineering");
    expect(res.body.jobTitles).toEqual(["Accountant", "Software Engineer"]);
  });

  it("answers the health check", async () => {
    const res = await request(http).get("/api/health").expect(200);
    expect(res.body).toEqual({ status: "ok", database: "up" });
  });
});
