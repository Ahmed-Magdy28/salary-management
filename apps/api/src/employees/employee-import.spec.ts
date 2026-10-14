import { chunk, partitionImportRows } from "./employee-import";

const good = {
  fullName: "Lena Fischer",
  email: "lena@acme.example",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "DE",
  currency: "EUR",
  salary: 72000,
  hireDate: "2021-03-15",
};

describe("partitionImportRows", () => {
  it("keeps valid rows with their row numbers", () => {
    const { valid, failed } = partitionImportRows([{ row: 2, data: good }]);
    expect(failed).toEqual([]);
    expect(valid).toEqual([{ row: 2, data: expect.objectContaining({ email: "lena@acme.example", status: "ACTIVE" }) }]);
  });

  it("reports invalid rows with the spreadsheet row number and field messages", () => {
    const { valid, failed } = partitionImportRows([{ row: 7, data: { ...good, salary: 0, email: "Bad" } }]);
    expect(valid).toEqual([]);
    expect(failed[0].row).toBe(7);
    expect(failed[0].email).toBe("bad");
    expect(failed[0].errors).toEqual(
      expect.arrayContaining([
        { path: "salary", message: "Salary must be greater than 0" },
        { path: "email", message: "Enter a valid email address" },
      ]),
    );
  });

  it("flags a repeated email inside the file and keeps the first occurrence", () => {
    const { valid, failed } = partitionImportRows([
      { row: 2, data: good },
      { row: 5, data: { ...good, fullName: "Copy", email: "LENA@acme.example" } },
    ]);
    expect(valid.map((v) => v.row)).toEqual([2]);
    expect(failed).toEqual([{ row: 5, email: "lena@acme.example", errors: [{ path: "email", message: "Same email as row 2 in this file" }] }]);
  });

  it("copes with rows that are not objects", () => {
    const { failed } = partitionImportRows([{ row: 2, data: null }, { row: 3, data: "text" }]);
    expect(failed.map((f) => f.email)).toEqual([null, null]);
    expect(failed).toHaveLength(2);
  });

  it("checks currency against country like the single-employee form", () => {
    const { failed } = partitionImportRows([{ row: 2, data: { ...good, currency: "USD" } }]);
    expect(failed[0].errors[0].message).toBe("Currency for this country must be EUR");
  });
});

describe("chunk", () => {
  it("splits a list into batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});
