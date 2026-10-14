/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { partitionImportRows } from "@salary/shared";
import { readSheet } from "read-excel-file/universal";
import { mapSpreadsheetRows } from "./map-rows";

const load = async (name: string) => {
  const buffer = readFileSync(path.join(__dirname, "../../../test/fixtures", name));
  return (await readSheet(new Blob([buffer]))) as unknown[][];
};

describe("importing a real .xlsx file", () => {
  it("maps messy cells (date cells, text salaries, names for countries) and numbers rows like Excel", async () => {
    const mapped = mapSpreadsheetRows(await load("employees.xlsx"));

    expect(mapped.missing).toEqual([]);
    expect(mapped.unknownColumns).toEqual(["Notes"]);
    expect(mapped.rows.map((r) => r.row)).toEqual([2, 3, 5]);
    expect(mapped.rows[0].data).toMatchObject({
      fullName: "Lena Fischer",
      email: "Lena.Fischer@acme.example",
      department: "Engineering",
      country: "DE",
      currency: "EUR",
      salary: 72000,
      hireDate: "2021-03-15",
      status: "ACTIVE",
    });
    expect(mapped.rows[1].data).toMatchObject({ salary: 91500, hireDate: "2019-08-01", status: undefined });
  });

  it("validates with the shared rules: two ready, one rejected with readable reasons", async () => {
    const { valid, failed } = partitionImportRows(mapSpreadsheetRows(await load("employees.xlsx")).rows);

    expect(valid.map((v) => v.row)).toEqual([2, 3]);
    expect(valid[0].data.email).toBe("lena.fischer@acme.example");
    expect(valid[0].data.status).toBe("ACTIVE");

    expect(failed).toHaveLength(1);
    expect(failed[0].row).toBe(5);
    const messages = failed[0].errors.map((e) => e.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        "Enter a valid email address",
        "Salary must be greater than 0",
        "Use the format YYYY-MM-DD",
      ]),
    );
    expect(messages.some((m) => m.startsWith("Country must be one of"))).toBe(true);
  });

  it("reports missing required columns", async () => {
    const mapped = mapSpreadsheetRows(await load("missing-columns.xlsx"));
    expect(mapped.missing).toEqual(["jobTitle", "department", "country", "salary", "hireDate"]);
  });
});
