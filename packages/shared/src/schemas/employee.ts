import { z } from "zod";
import {
  COUNTRY_BY_CODE,
  COUNTRY_CODES,
  CURRENCY_CODES,
  DEFAULT_PAGE_SIZE,
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  MAX_PAGE_SIZE,
  MAX_SALARY,
} from "../constants";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Enter a real calendar date");

const employeeFields = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  jobTitle: z.string().trim().min(1, "Job title is required").max(100),
  department: z.enum(DEPARTMENTS),
  country: z.enum(COUNTRY_CODES),
  currency: z.enum(CURRENCY_CODES),
  salary: z
    .number({ invalid_type_error: "Salary must be a number" })
    .int("Salary must be a whole number")
    .positive("Salary must be greater than 0")
    .max(MAX_SALARY, "Salary is too large"),
  hireDate: isoDate,
  status: z.enum(EMPLOYEE_STATUSES).default("ACTIVE"),
});

type EmployeeFields = z.infer<typeof employeeFields>;

/** Currency must match the country's currency whenever both are provided. */
function checkCurrencyMatchesCountry(
  value: Partial<Pick<EmployeeFields, "country" | "currency">>,
  ctx: z.RefinementCtx,
): void {
  if (!value.country || !value.currency) return;
  const expected = COUNTRY_BY_CODE[value.country]?.currency;
  if (expected && expected !== value.currency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currency"],
      message: `Currency for this country must be ${expected}`,
    });
  }
}

export const createEmployeeSchema = employeeFields.superRefine(checkCurrencyMatchesCountry);
export const updateEmployeeSchema = employeeFields.partial().superRefine(checkCurrencyMatchesCountry);
export const setStatusSchema = z.object({ status: z.enum(EMPLOYEE_STATUSES) });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const EMPLOYEE_SORT_FIELDS = ["fullName", "salary", "hireDate"] as const;

export const listEmployeesQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    country: z.enum(COUNTRY_CODES).optional(),
    department: z.enum(DEPARTMENTS).optional(),
    jobTitle: z.string().trim().max(100).optional(),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
    minSalary: z.coerce.number().int().nonnegative().optional(),
    maxSalary: z.coerce.number().int().nonnegative().optional(),
    sortBy: z.enum(EMPLOYEE_SORT_FIELDS).default("fullName"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .superRefine((q, ctx) => {
    if ((q.minSalary !== undefined || q.maxSalary !== undefined) && !q.country) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["country"],
        message: "Select a country to filter by salary (salaries are in local currency)",
      });
    }
    if (q.minSalary !== undefined && q.maxSalary !== undefined && q.minSalary > q.maxSalary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minSalary"],
        message: "Minimum salary cannot exceed maximum salary",
      });
    }
  });

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
