import { countryName, formatCompact, formatMoney, initials } from "./format";

describe("formatMoney", () => {
  it("shows the currency code and whole units", () => {
    expect(formatMoney(72000, "EUR")).toBe("EUR 72,000");
    expect(formatMoney(9575000, "JPY")).toBe("JPY 9,575,000");
  });
});

describe("formatCompact", () => {
  it("shortens large numbers for chart labels", () => {
    expect(formatCompact(52000)).toBe("52K");
    expect(formatCompact(1250000)).toBe("1.3M");
  });
});

describe("countryName", () => {
  it("maps a code to a name and falls back to the code", () => {
    expect(countryName("DE")).toBe("Germany");
    expect(countryName("ZZ")).toBe("ZZ");
  });
});

describe("initials", () => {
  it("uses first and last name", () => {
    expect(initials("Lena Fischer")).toBe("LF");
    expect(initials("Mary Ann Smith")).toBe("MS");
  });
  it("handles a single name and blanks", () => {
    expect(initials("Madonna")).toBe("M");
    expect(initials("   ")).toBe("?");
  });
});
