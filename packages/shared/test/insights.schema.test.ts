import { distributionQuerySchema, salaryStatsQuerySchema } from "../src";

describe("salaryStatsQuerySchema", () => {
  it("accepts country and department grouping without a country scope", () => {
    expect(salaryStatsQuerySchema.safeParse({ groupBy: "country" }).success).toBe(true);
    expect(salaryStatsQuerySchema.safeParse({ groupBy: "department" }).success).toBe(true);
  });

  it("requires a country for job title grouping", () => {
    expect(salaryStatsQuerySchema.safeParse({ groupBy: "jobTitle" }).success).toBe(false);
    expect(salaryStatsQuerySchema.safeParse({ groupBy: "jobTitle", country: "DE" }).success).toBe(true);
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
