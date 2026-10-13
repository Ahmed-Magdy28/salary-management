import type { Employee } from "@salary/db";
import type { Department, EmployeeDto } from "@salary/shared";

export function toEmployeeDto(row: Employee): EmployeeDto {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    jobTitle: row.jobTitle,
    department: row.department as Department,
    country: row.country,
    currency: row.currency,
    salary: row.salary,
    hireDate: row.hireDate.toISOString().slice(0, 10),
    status: row.status,
  };
}
