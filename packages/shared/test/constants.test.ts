import { COUNTRIES, COUNTRY_BY_CODE, DEPARTMENTS } from "../src";

describe("constants", () => {
  it("has unique country codes with a currency each", () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(COUNTRIES.every((c) => c.currency.length === 3)).toBe(true);
  });

  it("looks countries up by code", () => {
    expect(COUNTRY_BY_CODE.DE.currency).toBe("EUR");
  });

  it("lists departments", () => {
    expect(DEPARTMENTS).toContain("Engineering");
  });
});
