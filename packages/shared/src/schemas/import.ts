import { z } from "zod";
import { createEmployeeSchema, type CreateEmployeeInput } from "./employee";

export const MAX_IMPORT_ROWS = 10_000;

/**
 * One spreadsheet row. `row` is the row number in the user's file (header = row 1),
 * so errors can point at the exact line. `data` is validated per row by the API.
 */
export const importRequestSchema = z.object({
  rows: z
    .array(z.object({ row: z.number().int().positive(), data: z.unknown() }))
    .min(1, "The file has no data rows")
    .max(MAX_IMPORT_ROWS, `Import at most ${MAX_IMPORT_ROWS.toLocaleString("en-US")} rows at a time`),
});

export type ImportRequest = z.infer<typeof importRequestSchema>;

export interface ImportFailure {
  row: number;
  email: string | null;
  errors: { path: string; message: string }[];
}

export interface ImportResultDto {
  total: number;
  created: number;
  failed: ImportFailure[];
}

export interface ValidImportRow {
  row: number;
  data: CreateEmployeeInput;
}

function emailOf(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const email = (data as { email?: unknown }).email;
  return typeof email === "string" && email.trim() !== "" ? email.trim().toLowerCase() : null;
}

/**
 * Validates every row with the same schema used for single employees, and flags
 * repeated emails inside the file (the first occurrence wins). Used by the browser
 * preview and by the API, so both always agree.
 */
export function partitionImportRows(rows: ImportRequest["rows"]): { valid: ValidImportRow[]; failed: ImportFailure[] } {
  const valid: ValidImportRow[] = [];
  const failed: ImportFailure[] = [];
  const firstRowByEmail = new Map<string, number>();

  for (const { row, data } of rows) {
    const result = createEmployeeSchema.safeParse(data);
    if (!result.success) {
      failed.push({
        row,
        email: emailOf(data),
        errors: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      continue;
    }

    const email = result.data.email;
    const firstRow = firstRowByEmail.get(email);
    if (firstRow !== undefined) {
      failed.push({ row, email, errors: [{ path: "email", message: `Same email as row ${firstRow} in this file` }] });
      continue;
    }
    firstRowByEmail.set(email, row);
    valid.push({ row, data: result.data });
  }
  return { valid, failed };
}
