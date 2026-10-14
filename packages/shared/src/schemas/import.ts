import { z } from "zod";

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
