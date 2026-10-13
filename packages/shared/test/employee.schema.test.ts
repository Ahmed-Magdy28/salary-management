import { createEmployeeSchema, listEmployeesQuerySchema, updateEmployeeSchema } from "../src";

const valid = {
  fullName: "Lena Fischer",
  email: "Lena.Fischer@Acme.example",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "DE",
  currency: "EUR",
  salary: 72000,
  hireDate: "2021-03-15",
};

describe("createEmployeeSchema", () => {
  it("accepts a valid employee, lowercases the email and defaults status", () => {
    const parsed = createEmployeeSchema.parse(valid);
    expect(parsed.email).toBe("lena.fischer@acme.example");
    expect(parsed.status).toBe("ACTIVE");
  });

  it.each([
    ["salary of zero", { salary: 0 }, "salary"],
    ["negative salary", { salary: -5 }, "salary"],
    ["fractional salary", { salary: 10.5 }, "salary"],
    ["invalid email", { email: "lena@acme" }, "email"],
    ["blank name", { fullName: "   " }, "fullName"],
    ["unknown department", { department: "Piracy" }, "department"],
    ["unknown country", { country: "XX" }, "country"],
    ["impossible date", { hireDate: "2021-02-31" }, "hireDate"],
    ["wrong date format", { hireDate: "15/03/2021" }, "hireDate"],
  ])("rejects %s", (_name, override, field) => {
    const result = createEmployeeSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path[0])).toContain(field);
    }
  });

  it("rejects a currency that does not match the country", () => {
    const result = createEmployeeSchema.safeParse({ ...valid, currency: "USD" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Currency for this country must be EUR");
  });
});

describe("updateEmployeeSchema", () => {
  it("allows partial updates", () => {
    expect(updateEmployeeSchema.parse({ salary: 80000 })).toEqual({ salary: 80000 });
  });

  it("still validates fields that are present", () => {
    expect(updateEmployeeSchema.safeParse({ salary: 0 }).success).toBe(false);
  });

  it("checks currency against country only when both are sent", () => {
    expect(updateEmployeeSchema.safeParse({ country: "JP" }).success).toBe(true);
    expect(updateEmployeeSchema.safeParse({ country: "JP", currency: "EUR" }).success).toBe(false);
  });
});

describe("listEmployeesQuerySchema", () => {
  it("applies defaults", () => {
    expect(listEmployeesQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 50,
      sortBy: "fullName",
      sortOrder: "asc",
    });
  });

  it("coerces numeric query strings", () => {
    const q = listEmployeesQuerySchema.parse({ page: "2", pageSize: "25", country: "DE", minSalary: "1000" });
    expect(q).toMatchObject({ page: 2, pageSize: 25, minSalary: 1000 });
  });

  it("caps page size", () => {
    expect(listEmployeesQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
  });

  it("requires a country for salary filters", () => {
    expect(listEmployeesQuerySchema.safeParse({ minSalary: "1000" }).success).toBe(false);
    expect(listEmployeesQuerySchema.safeParse({ minSalary: "1000", country: "DE" }).success).toBe(true);
  });

  it("rejects min greater than max", () => {
    const r = listEmployeesQuerySchema.safeParse({ country: "DE", minSalary: "9", maxSalary: "3" });
    expect(r.success).toBe(false);
  });
});
