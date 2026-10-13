export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Finance",
  "People",
  "Operations",
  "Customer Support",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
}

export const COUNTRIES: readonly CountryInfo[] = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "EG", name: "Egypt", currency: "EGP" },
  { code: "BR", name: "Brazil", currency: "BRL" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "CA", name: "Canada", currency: "CAD" },
];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [string, ...string[]];
export const CURRENCY_CODES = Array.from(new Set(COUNTRIES.map((c) => c.currency))) as [string, ...string[]];

export const COUNTRY_BY_CODE: Readonly<Record<string, CountryInfo>> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);

export const MAX_SALARY = 1_000_000_000;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
/** Groups smaller than this are flagged as low-sample in insights. */
export const LOW_SAMPLE_THRESHOLD = 5;
