import { IMPORT_TEMPLATE_CSV, mapHeaders, mapSpreadsheetRows, toCountryCode, toDepartment, toIsoDate, toSalary, toStatus } from "./map-rows";

describe("mapHeaders", () => {
  it("recognises common header spellings in any order", () => {
    const { columns, missing } = mapHeaders(["E-mail", "Full Name", "Position", "Dept", "Location", "Base Salary", "Start Date"]);
    expect(columns).toMatchObject({ email: 0, fullName: 1, jobTitle: 2, department: 3, country: 4, salary: 5, hireDate: 6 });
    expect(missing).toEqual([]);
  });

  it("lists required columns that are missing and ignores optional ones", () => {
    expect(mapHeaders(["Name", "Email"]).missing).toEqual(["jobTitle", "department", "country", "salary", "hireDate"]);
  });

  it("reports unrecognised columns instead of guessing", () => {
    expect(mapHeaders(["Name", "Email", "Favourite colour"]).unknownColumns).toEqual(["Favourite colour"]);
  });
});

describe("toIsoDate", () => {
  it("formats Excel date cells (UTC midnight) without shifting the day", () => {
    expect(toIsoDate(new Date("2021-03-15T00:00:00.000Z"))).toBe("2021-03-15");
  });
  it("accepts year-first text and pads it", () => {
    expect(toIsoDate("2021/3/5")).toBe("2021-03-05");
    expect(toIsoDate("2021-03-15")).toBe("2021-03-15");
  });
  it("leaves ambiguous day/month text alone so it is rejected, not guessed", () => {
    expect(toIsoDate("03/04/2021")).toBe("03/04/2021");
  });
  it("treats blanks as missing", () => {
    expect(toIsoDate("")).toBeUndefined();
    expect(toIsoDate(null)).toBeUndefined();
  });
});

describe("toSalary", () => {
  it.each([
    [72000, 72000],
    ["72,000", 72000],
    ["EUR 72,000", 72000],
    ["72.000", 72000],
    ["  91500 ", 91500],
  ])("reads %p as %p", (input, expected) => expect(toSalary(input)).toBe(expected));

  it("keeps decimals so they are rejected as not whole numbers", () => {
    expect(toSalary("72000.5")).toBe(72000.5);
  });
  it("passes unreadable text on to be rejected", () => {
    expect(toSalary("lots")).toBe("lots");
  });
  it("treats blanks as missing", () => {
    expect(toSalary("")).toBeUndefined();
  });
});

describe("toCountryCode", () => {
  it("accepts codes and full names in any case", () => {
    expect(toCountryCode("de")).toBe("DE");
    expect(toCountryCode("Germany")).toBe("DE");
    expect(toCountryCode("united states")).toBe("US");
  });
  it("accepts a few common aliases", () => {
    expect(toCountryCode("UK")).toBe("GB");
    expect(toCountryCode("USA")).toBe("US");
  });
  it("keeps unknown countries as typed so the error can quote them", () => {
    expect(toCountryCode("Narnia")).toBe("Narnia");
  });
});

describe("toDepartment and toStatus", () => {
  it("matches departments ignoring case", () => {
    expect(toDepartment("customer support")).toBe("Customer Support");
    expect(toDepartment("Piracy")).toBe("Piracy");
  });
  it("reads status words and leaves blanks to default to active", () => {
    expect(toStatus("inactive")).toBe("INACTIVE");
    expect(toStatus("Active")).toBe("ACTIVE");
    expect(toStatus("")).toBeUndefined();
  });
});

describe("mapSpreadsheetRows", () => {
  const header = ["Full name", "Email", "Job title", "Department", "Country", "Annual salary", "Hire date"];

  it("numbers rows like the file (header is row 1) and skips blank rows", () => {
    const table = [header, ["A", "a@x.co", "Dev", "Engineering", "Germany", 1, "2020-01-01"], [null, "", null, null, null, null, null], ["B", "b@x.co", "Dev", "Engineering", "US", 2, "2020-01-01"]];
    expect(mapSpreadsheetRows(table).rows.map((r) => r.row)).toEqual([2, 4]);
  });

  it("derives the currency from the country when the column is absent or blank", () => {
    const { rows } = mapSpreadsheetRows([header, ["A", "a@x.co", "Dev", "Engineering", "Japan", 1, "2020-01-01"]]);
    expect(rows[0].data).toMatchObject({ country: "JP", currency: "JPY" });
  });

  it("flags an empty file", () => {
    expect(mapSpreadsheetRows([]).missing).toContain("email");
  });
});

describe("IMPORT_TEMPLATE_CSV", () => {
  it("uses headers that the importer recognises", () => {
    const headers = IMPORT_TEMPLATE_CSV.split("\n")[0].split(",");
    expect(mapHeaders(headers).missing).toEqual([]);
    expect(mapHeaders(headers).unknownColumns).toEqual([]);
  });
});
