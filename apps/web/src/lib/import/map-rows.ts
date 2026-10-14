import { COUNTRIES, COUNTRY_BY_CODE, DEPARTMENTS, type ImportRequest } from "@salary/shared";

export const IMPORT_FIELDS = ["fullName", "email", "jobTitle", "department", "country", "currency", "salary", "hireDate", "status"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/** Currency and status are optional: currency follows the country, status defaults to active. */
export const REQUIRED_FIELDS: ImportField[] = ["fullName", "email", "jobTitle", "department", "country", "salary", "hireDate"];

export const FIELD_LABELS: Record<ImportField, string> = {
  fullName: "Full name",
  email: "Email",
  jobTitle: "Job title",
  department: "Department",
  country: "Country",
  currency: "Currency",
  salary: "Annual salary",
  hireDate: "Hire date",
  status: "Status",
};

/** Header names people commonly use, compared after lowercasing and removing punctuation. */
const ALIASES: Record<ImportField, string[]> = {
  fullName: ["fullname", "name", "employeename", "employee"],
  email: ["email", "emailaddress", "mail", "workemail"],
  jobTitle: ["jobtitle", "title", "position", "role"],
  department: ["department", "dept", "team"],
  country: ["country", "location", "countryname"],
  currency: ["currency", "currencycode"],
  salary: ["annualsalary", "salary", "basesalary", "annualpay", "pay"],
  hireDate: ["hiredate", "startdate", "dateofhire", "joined", "joindate", "hiredon"],
  status: ["status", "employmentstatus"],
};

const COUNTRY_ALIASES: Record<string, string> = { usa: "US", "united states of america": "US", uk: "GB", "great britain": "GB", england: "GB" };

const normalizeHeader = (value: unknown): string => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function cellText(value: unknown): string {
  if (value === null || value === undefined || value instanceof Date) return "";
  return String(value).trim();
}

const isBlank = (value: unknown): boolean => value === null || value === undefined || (!(value instanceof Date) && cellText(value) === "");

export interface HeaderMapping {
  columns: Partial<Record<ImportField, number>>;
  missing: ImportField[];
  unknownColumns: string[];
}

export function mapHeaders(headerRow: unknown[]): HeaderMapping {
  const columns: Partial<Record<ImportField, number>> = {};
  const unknownColumns: string[] = [];

  headerRow.forEach((header, index) => {
    const key = normalizeHeader(header);
    if (!key) return;
    const field = IMPORT_FIELDS.find((f) => columns[f] === undefined && ALIASES[f].includes(key));
    if (field) columns[field] = index;
    else unknownColumns.push(cellText(header));
  });

  return { columns, missing: REQUIRED_FIELDS.filter((f) => columns[f] === undefined), unknownColumns };
}

const pad = (n: number | string) => String(n).padStart(2, "0");

/**
 * Real Excel dates arrive as Date objects at UTC midnight. Text must already be year-first;
 * day/month text such as 03/04/2021 is ambiguous, so it is left alone and rejected with a clear message.
 */
export function toIsoDate(value: unknown): string | undefined {
  if (isBlank(value)) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  const text = cellText(value);
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text);
  return match ? `${match[1]}-${pad(match[2])}-${pad(match[3])}` : text;
}

export function toCountryCode(value: unknown): string | undefined {
  const text = cellText(value);
  if (!text) return undefined;
  const lower = text.toLowerCase();
  if (COUNTRY_BY_CODE[text.toUpperCase()]) return text.toUpperCase();
  const byName = COUNTRIES.find((c) => c.name.toLowerCase() === lower);
  return byName?.code ?? COUNTRY_ALIASES[lower] ?? text;
}

export function toDepartment(value: unknown): string | undefined {
  const text = cellText(value);
  if (!text) return undefined;
  return DEPARTMENTS.find((d) => d.toLowerCase() === text.toLowerCase()) ?? text;
}

/** Accepts 72000, "72,000", "EUR 72,000" and "72.000" (dots as thousands). Anything else is passed on to be rejected. */
export function toSalary(value: unknown): number | string | undefined {
  if (isBlank(value)) return undefined;
  if (typeof value === "number") return value;
  const text = cellText(value);
  const cleaned = text.replace(/[^\d.,-]/g, "");
  if (!cleaned) return text;
  const withoutThousands = /^\d{1,3}(\.\d{3})+$/.test(cleaned) ? cleaned.replace(/\./g, "") : cleaned.replace(/,/g, "");
  const number = Number(withoutThousands);
  return Number.isFinite(number) ? number : text;
}

export function toStatus(value: unknown): string | undefined {
  const text = cellText(value);
  if (!text) return undefined;
  const upper = text.toUpperCase();
  return upper === "ACTIVE" || upper === "INACTIVE" ? upper : text;
}

function normalizeRow(cells: unknown[], columns: HeaderMapping["columns"]): Record<string, unknown> {
  const at = (field: ImportField): unknown => (columns[field] === undefined ? undefined : cells[columns[field] as number]);
  const country = toCountryCode(at("country"));
  const currencyText = cellText(at("currency"));
  return {
    fullName: cellText(at("fullName")),
    email: cellText(at("email")),
    jobTitle: cellText(at("jobTitle")),
    department: toDepartment(at("department")),
    country,
    currency: currencyText ? currencyText.toUpperCase() : country ? COUNTRY_BY_CODE[country]?.currency : undefined,
    salary: toSalary(at("salary")),
    hireDate: toIsoDate(at("hireDate")),
    status: toStatus(at("status")),
  };
}

export interface MappedImport {
  rows: ImportRequest["rows"];
  missing: ImportField[];
  unknownColumns: string[];
}

/** Turns a spreadsheet (header row + data rows) into import rows numbered like the user's file. */
export function mapSpreadsheetRows(table: unknown[][]): MappedImport {
  if (table.length === 0) return { rows: [], missing: [...REQUIRED_FIELDS], unknownColumns: [] };

  const { columns, missing, unknownColumns } = mapHeaders(table[0]);
  const rows: ImportRequest["rows"] = [];
  table.slice(1).forEach((cells, index) => {
    if (cells.every(isBlank)) return;
    rows.push({ row: index + 2, data: normalizeRow(cells, columns) });
  });
  return { rows, missing, unknownColumns };
}

export const IMPORT_TEMPLATE_CSV = [
  ["Full name", "Email", "Job title", "Department", "Country", "Currency", "Annual salary", "Hire date", "Status"].join(","),
  ["Lena Fischer", "lena.fischer@company.com", "Software Engineer", "Engineering", "Germany", "EUR", "72000", "2021-03-15", "Active"].join(","),
].join("\n") + "\n";
