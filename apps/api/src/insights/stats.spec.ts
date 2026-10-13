import { buildBands, toStatsRow, toSummary } from "./stats";

const raw = { count: 6, min: 50000, p25: 62500.4, median: 75000.5, mean: 75000, p75: 87499.6, max: 100000 };

describe("toSummary", () => {
  it("rounds percentiles and mean to whole numbers", () => {
    expect(toSummary(raw)).toEqual({ count: 6, min: 50000, p25: 62500, median: 75001, mean: 75000, p75: 87500, max: 100000 });
  });
});

describe("toStatsRow", () => {
  it("flags groups with fewer than 5 people as low sample", () => {
    expect(toStatsRow({ ...raw, group: "QA", currency: "EUR", count: 4 }).lowSample).toBe(true);
    expect(toStatsRow({ ...raw, group: "QA", currency: "EUR", count: 5 }).lowSample).toBe(false);
  });

  it("keeps the group and currency", () => {
    expect(toStatsRow({ ...raw, group: "DE", currency: "EUR" })).toMatchObject({ group: "DE", currency: "EUR" });
  });
});

describe("buildBands", () => {
  it("builds contiguous inclusive ranges that cover min to max", () => {
    const bands = buildBands(50000, 100000, 5, [
      { bucket: 1, count: 2 },
      { bucket: 2, count: 1 },
      { bucket: 5, count: 1 },
    ]);
    expect(bands).toEqual([
      { from: 50000, to: 60000, count: 2 },
      { from: 60001, to: 70000, count: 1 },
      { from: 70001, to: 80000, count: 0 },
      { from: 80001, to: 90000, count: 0 },
      { from: 90001, to: 100000, count: 1 },
    ]);
  });

  it("returns one band when everyone earns the same", () => {
    expect(buildBands(70000, 70000, 10, [{ bucket: 1, count: 3 }])).toEqual([{ from: 70000, to: 70000, count: 3 }]);
  });

  it("returns exactly the requested number of bands", () => {
    expect(buildBands(0, 999, 10, [])).toHaveLength(10);
  });
});
