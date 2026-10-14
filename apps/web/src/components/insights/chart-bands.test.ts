import type { DistributionDto } from "@salary/shared";
import { toChartBands } from "./chart-bands";

const distribution: DistributionDto = {
  country: "DE",
  currency: "EUR",
  jobTitle: null,
  summary: { count: 6, min: 50000, p25: 62500, median: 75000, mean: 75000, p75: 87500, max: 100000 },
  bands: [
    { from: 50000, to: 70000, count: 3 },
    { from: 70001, to: 90000, count: 2 },
    { from: 90001, to: 100000, count: 1 },
  ],
};

describe("toChartBands", () => {
  it("labels bands compactly and keeps counts", () => {
    const bands = toChartBands(distribution);
    expect(bands.map((b) => b.label)).toEqual(["50K-70K", "70K-90K", "90K-100K"]);
    expect(bands.map((b) => b.count)).toEqual([3, 2, 1]);
  });

  it("flags only the band that contains the median", () => {
    expect(toChartBands(distribution).map((b) => b.hasMedian)).toEqual([false, true, false]);
  });

  it("describes each range with the currency for tooltips", () => {
    expect(toChartBands(distribution)[0].range).toBe("EUR 50,000 to EUR 70,000");
  });

  it("returns nothing when there are no bands", () => {
    expect(toChartBands({ ...distribution, summary: null, bands: [] })).toEqual([]);
  });

  it("uses a single label when everyone earns the same", () => {
    const same = { ...distribution, bands: [{ from: 70000, to: 70000, count: 4 }] };
    expect(toChartBands(same)[0].label).toBe("70K");
  });
});
