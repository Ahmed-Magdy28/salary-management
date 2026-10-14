import { COUNTRY_BY_CODE, createEmployeeSchema, type CreateEmployeeInput, type EmployeeDto } from "@salary/shared";
import { issuesToFieldErrors } from "./form-errors";

/** All inputs are strings while the user is typing. */
export interface EmployeeFormValues {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salary: string;
  hireDate: string;
  status: string;
}

export const EMPTY_FORM: EmployeeFormValues = {
  fullName: "",
  email: "",
  jobTitle: "",
  department: "",
  country: "",
  currency: "",
  salary: "",
  hireDate: "",
  status: "ACTIVE",
};

export function toFormValues(employee: EmployeeDto): EmployeeFormValues {
  return { ...employee, salary: String(employee.salary) };
}

/** Picking a country sets its currency, as the form promises. */
export function withCountry(values: EmployeeFormValues, country: string): EmployeeFormValues {
  return { ...values, country, currency: COUNTRY_BY_CODE[country]?.currency ?? "" };
}

export type FormResult =
  | { ok: true; data: CreateEmployeeInput }
  | { ok: false; errors: Record<string, string> };

/** Runs the same shared schema the API uses, before anything is sent. */
export function validateEmployeeForm(values: EmployeeFormValues): FormResult {
  const salaryText = values.salary.replace(/[,\s]/g, "");
  const result = createEmployeeSchema.safeParse({
    ...values,
    salary: salaryText === "" ? undefined : Number(salaryText),
  });
  if (result.success) return { ok: true, data: result.data };
  const errors = issuesToFieldErrors(result.error.issues);
  // Currency is derived from country, so one message on country is enough.
  if (errors.country) delete errors.currency;
  return { ok: false, errors };
}
