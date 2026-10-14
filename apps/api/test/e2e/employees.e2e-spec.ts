import request from "supertest";
import { createTestApp, employee, insertEmployees, type TestApp } from "./app";

describe("Employees API (e2e)", () => {
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

  describe("create and read", () => {
    it("creates an employee and returns it with an id", async () => {
      const res = await request(http).post("/api/employees").send(employee()).expect(201);
      expect(res.body).toMatchObject({ fullName: "Lena Fischer", salary: 72000, status: "ACTIVE", hireDate: "2021-03-15" });
      expect(res.body.id).toEqual(expect.any(String));

      const got = await request(http).get(`/api/employees/${res.body.id}`).expect(200);
      expect(got.body.email).toBe("lena.fischer@acme.example");
    });

    it("returns field-level errors for invalid input", async () => {
      const res = await request(http).post("/api/employees").send(employee({ salary: 0, email: "nope" })).expect(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          { path: "salary", message: "Salary must be greater than 0" },
          { path: "email", message: "Enter a valid email address" },
        ]),
      );
    });

    it("rejects a duplicate email with 409", async () => {
      await request(http).post("/api/employees").send(employee()).expect(201);
      const res = await request(http).post("/api/employees").send(employee({ fullName: "Other" })).expect(409);
      expect(res.body.errors[0].path).toBe("email");
    });

    it("returns 404 for an unknown employee", async () => {
      await request(http).get("/api/employees/does-not-exist").expect(404);
    });
  });

  describe("update and status", () => {
    it("updates the salary", async () => {
      const created = await request(http).post("/api/employees").send(employee()).expect(201);
      const res = await request(http).patch(`/api/employees/${created.body.id}`).send({ salary: 80000 }).expect(200);
      expect(res.body.salary).toBe(80000);
    });

    it("rejects a duplicate email on update", async () => {
      await request(http).post("/api/employees").send(employee()).expect(201);
      const other = await request(http).post("/api/employees").send(employee({ email: "b@acme.example" })).expect(201);
      await request(http).patch(`/api/employees/${other.body.id}`).send({ email: "lena.fischer@acme.example" }).expect(409);
    });

    it("rejects changing the country without its currency", async () => {
      const created = await request(http).post("/api/employees").send(employee()).expect(201);
      await request(http).patch(`/api/employees/${created.body.id}`).send({ country: "JP" }).expect(400);
    });

    it("deactivates and reactivates an employee", async () => {
      const created = await request(http).post("/api/employees").send(employee()).expect(201);
      const off = await request(http).patch(`/api/employees/${created.body.id}/status`).send({ status: "INACTIVE" }).expect(200);
      expect(off.body.status).toBe("INACTIVE");
      const on = await request(http).patch(`/api/employees/${created.body.id}/status`).send({ status: "ACTIVE" }).expect(200);
      expect(on.body.status).toBe("ACTIVE");
    });

    it("returns 404 when changing the status of an unknown employee", async () => {
      await request(http).patch("/api/employees/nope/status").send({ status: "INACTIVE" }).expect(404);
    });
  });

  describe("list", () => {
    beforeEach(async () => {
      await insertEmployees(ctx.prisma, [
        employee({ fullName: "Lena Fischer", email: "lena@acme.example", salary: 72000 }),
        employee({ fullName: "Jonas Weber", email: "jonas@acme.example", salary: 91500, jobTitle: "Senior Engineer" }),
        employee({ fullName: "Mira Hoffmann", email: "mira@acme.example", salary: 55000, department: "Finance", jobTitle: "Accountant" }),
        employee({ fullName: "Sam Carter", email: "sam@acme.example", country: "US", currency: "USD", salary: 120000 }),
        employee({ fullName: "Old Timer", email: "old@acme.example", salary: 60000, status: "INACTIVE" }),
      ]);
    });

    it("paginates with a total count", async () => {
      const page1 = await request(http).get("/api/employees?pageSize=2&page=1").expect(200);
      const page2 = await request(http).get("/api/employees?pageSize=2&page=2").expect(200);
      expect(page1.body).toMatchObject({ total: 5, page: 1, pageSize: 2 });
      expect(page1.body.items).toHaveLength(2);
      expect(page2.body.items).toHaveLength(2);
      const ids = [...page1.body.items, ...page2.body.items].map((e: { id: string }) => e.id);
      expect(new Set(ids).size).toBe(4);
    });

    it("searches name or email, ignoring case", async () => {
      const res = await request(http).get("/api/employees?search=JONAS").expect(200);
      expect(res.body.items.map((e: { fullName: string }) => e.fullName)).toEqual(["Jonas Weber"]);
      const byEmail = await request(http).get("/api/employees?search=mira@").expect(200);
      expect(byEmail.body.total).toBe(1);
    });

    it("filters by country, department and status together", async () => {
      const res = await request(http).get("/api/employees?country=DE&department=Engineering&status=ACTIVE").expect(200);
      expect(res.body.total).toBe(2);
    });

    it("filters by salary range within a country", async () => {
      const res = await request(http).get("/api/employees?country=DE&minSalary=60000&maxSalary=80000&status=ACTIVE").expect(200);
      expect(res.body.items.map((e: { fullName: string }) => e.fullName)).toEqual(["Lena Fischer"]);
    });

    it("requires a country for salary filters", async () => {
      await request(http).get("/api/employees?minSalary=1000").expect(400);
    });

    it("sorts by salary descending", async () => {
      const res = await request(http).get("/api/employees?sortBy=salary&sortOrder=desc&pageSize=3").expect(200);
      expect(res.body.items.map((e: { salary: number }) => e.salary)).toEqual([120000, 91500, 72000]);
    });
  });
});

describe("CORS (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<TestApp["app"]["getHttpServer"]>;
  const origin = "http://localhost:3000";

  beforeAll(async () => {
    ctx = await createTestApp();
    http = ctx.app.getHttpServer();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it("allows the web origin and lets browsers cache the preflight", async () => {
    const res = await request(http)
      .options("/api/employees")
      .set("Origin", origin)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type")
      .expect(204);
    expect(res.headers["access-control-allow-origin"]).toBe(origin);
    expect(res.headers["access-control-max-age"]).toBe("86400");
  });

  it("does not allow other origins", async () => {
    const res = await request(http).get("/api/health").set("Origin", "https://evil.example").expect(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
