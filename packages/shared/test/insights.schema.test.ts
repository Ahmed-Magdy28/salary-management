import { distributionQuerySchema, salaryStatsQuerySchema } from "../src";

describe("salaryStatsQuerySchema", () => {
  it("accepts country grouping without a country scope", () => {
    expect(salaryStatsQuerySchema.safeParse({ groupBy: "country" }).success).toBe(true);
  });

  it.each(["department", "jobTitle"])("requires a country for %s grouping (no mixed currencies)", (groupBy) => {
    expect(salaryStatsQuerySchema.safeParse({ groupBy }).success).toBe(false);
    expect(salaryStatsQuerySchema.safeParse({ groupBy, country: "DE" }).success).toBe(true);
  });
});

describe("distributionQuerySchema", () => {
  it("requires a country and defaults to 10 bands", () => {
    expect(distributionQuerySchema.safeParse({}).success).toBe(false);
    expect(distributionQuerySchema.parse({ country: "DE" }).bands).toBe(10);
  });

  it("bounds the band count", () => {
    expect(distributionQuerySchema.safeParse({ country: "DE", bands: "1" }).success).toBe(false);
    expect(distributionQuerySchema.safeParse({ country: "DE", bands: "31" }).success).toBe(false);
  });
});
