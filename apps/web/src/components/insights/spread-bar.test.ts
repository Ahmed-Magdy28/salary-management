import { spreadPositions } from "./spread-bar";

describe("spreadPositions", () => {
  it("places the middle-half band and median as percentages of min to max", () => {
    expect(spreadPositions({ min: 0, p25: 25, median: 50, p75: 75, max: 100 })).toEqual({ bandLeft: 25, bandWidth: 50, median: 50 });
  });

  it("handles skewed pay where the band sits near the low end", () => {
    const pos = spreadPositions({ min: 40000, p25: 56000, median: 70000, p75: 88000, max: 210000 });
    expect(pos.bandLeft).toBeCloseTo(9.4, 1);
    expect(pos.median).toBeCloseTo(17.6, 1);
  });

  it("does not divide by zero when everyone earns the same", () => {
    expect(spreadPositions({ min: 5, p25: 5, median: 5, p75: 5, max: 5 })).toEqual({ bandLeft: 0, bandWidth: 100, median: 50 });
  });
});
