import {
  createEmployeeSchema,
  type CreateEmployeeInput,
  type ImportFailure,
  type ImportRequest,
} from "@salary/shared";

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
 * repeated emails inside the file (the first occurrence wins).
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

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
