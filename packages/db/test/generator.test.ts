import { COUNTRIES, createEmployeeSchema } from "@salary/shared";
import { generateEmployees } from "../src/seed/generator";

describe("generateEmployees", () => {
  const sample = generateEmployees(2000, 42);

  it("is deterministic for the same seed", () => {
    expect(generateEmployees(200, 7)).toEqual(generateEmployees(200, 7));
  });

  it("differs for a different seed", () => {
    expect(generateEmployees(50, 1)).not.toEqual(generateEmployees(50, 2));
  });

  it("returns the requested number of employees", () => {
    expect(sample).toHaveLength(2000);
  });

  it("produces unique emails", () => {
    expect(new Set(sample.map((e) => e.email)).size).toBe(sample.length);
  });

  it("only produces records that pass the shared validation schema", () => {
    for (const employee of sample) {
      const result = createEmployeeSchema.safeParse(employee);
      if (!result.success) throw new Error(`${employee.email}: ${result.error.message}`);
    }
  });

  it("uses the currency that belongs to each country", () => {
    const currencyOf = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.currency]));
    expect(sample.every((e) => currencyOf[e.country] === e.currency)).toBe(true);
  });

  it("covers every country and department", () => {
    expect(new Set(sample.map((e) => e.country)).size).toBe(COUNTRIES.length);
    expect(new Set(sample.map((e) => e.department)).size).toBe(9);
  });

  it("keeps hire dates inside the fixed window", () => {
    expect(sample.every((e) => e.hireDate >= "2012-01-01" && e.hireDate <= "2026-09-30")).toBe(true);
  });

  it("marks only a small share as inactive", () => {
    const inactive = sample.filter((e) => e.status === "INACTIVE").length / sample.length;
    expect(inactive).toBeGreaterThan(0.005);
    expect(inactive).toBeLessThan(0.08);
  });

  it("pays more in the US than in India after converting to USD", () => {
    const avgUsd = (code: string, perUsd: number): number => {
      const rows = sample.filter((e) => e.country === code);
      return rows.reduce((sum, e) => sum + e.salary / perUsd, 0) / rows.length;
    };
    expect(avgUsd("US", 1)).toBeGreaterThan(avgUsd("IN", 83) * 2);
  });
});
