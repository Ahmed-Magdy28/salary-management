import type { Prisma } from "@salary/db";
import type { ListEmployeesQuery } from "@salary/shared";

/** Translates validated list filters into a Prisma `where` clause. */
export function buildEmployeeWhere(query: ListEmployeesQuery): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.country) where.country = query.country;
  if (query.department) where.department = query.department;
  if (query.jobTitle) where.jobTitle = query.jobTitle;
  if (query.status) where.status = query.status;

  if (query.minSalary !== undefined || query.maxSalary !== undefined) {
    where.salary = {
      ...(query.minSalary !== undefined && { gte: query.minSalary }),
      ...(query.maxSalary !== undefined && { lte: query.maxSalary }),
    };
  }
  return where;
}

/** The id tiebreaker keeps page boundaries stable when sort values repeat. */
export function buildEmployeeOrderBy(query: ListEmployeesQuery): Prisma.EmployeeOrderByWithRelationInput[] {
  return [{ [query.sortBy]: query.sortOrder }, { id: "asc" }];
}
