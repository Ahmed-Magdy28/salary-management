import { importRequestSchema, MAX_IMPORT_ROWS } from "../src";

describe("importRequestSchema", () => {
  it("accepts rows that carry their spreadsheet row number", () => {
    expect(importRequestSchema.safeParse({ rows: [{ row: 2, data: { email: "a@b.co" } }] }).success).toBe(true);
  });

  it("rejects an empty file", () => {
    const r = importRequestSchema.safeParse({ rows: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("The file has no data rows");
  });

  it("rejects more rows than the limit", () => {
    const rows = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => ({ row: i + 2, data: {} }));
    expect(importRequestSchema.safeParse({ rows }).success).toBe(false);
  });

  it("rejects a row number below 1", () => {
    expect(importRequestSchema.safeParse({ rows: [{ row: 0, data: {} }] }).success).toBe(false);
  });
});
