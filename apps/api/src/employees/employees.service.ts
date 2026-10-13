import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@salary/db";
import {
  COUNTRY_BY_CODE,
  type CreateEmployeeInput,
  type EmployeeDto,
  type EmployeeStatus,
  type ListEmployeesQuery,
  type Paginated,
  type UpdateEmployeeInput,
} from "@salary/shared";
import { PrismaService } from "../prisma/prisma.service";
import { buildEmployeeOrderBy, buildEmployeeWhere } from "./employee-query";
import { toEmployeeDto } from "./employee.mapper";

const EMAIL_TAKEN = {
  statusCode: 409,
  message: "Email already in use",
  errors: [{ path: "email", message: "This email is already in use" }],
};

function toDbDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListEmployeesQuery): Promise<Paginated<EmployeeDto>> {
    const where = buildEmployeeWhere(query);
    const [rows, total] = await this.prisma.client.$transaction([
      this.prisma.client.employee.findMany({
        where,
        orderBy: buildEmployeeOrderBy(query),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.client.employee.count({ where }),
    ]);
    return { items: rows.map(toEmployeeDto), total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string): Promise<EmployeeDto> {
    const row = await this.prisma.client.employee.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Employee not found");
    return toEmployeeDto(row);
  }

  async create(input: CreateEmployeeInput): Promise<EmployeeDto> {
    try {
      const row = await this.prisma.client.employee.create({
        data: { ...input, hireDate: toDbDate(input.hireDate) },
      });
      return toEmployeeDto(row);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async update(id: string, input: UpdateEmployeeInput): Promise<EmployeeDto> {
    const existing = await this.prisma.client.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Employee not found");

    // The schema only checks currency against country when both are sent,
    // so check the merged record to catch a country change on its own.
    const country = input.country ?? existing.country;
    const currency = input.currency ?? existing.currency;
    const expected = COUNTRY_BY_CODE[country]?.currency;
    if (expected && expected !== currency) {
      throw new BadRequestException({
        statusCode: 400,
        message: "Validation failed",
        errors: [{ path: "currency", message: `Currency for this country must be ${expected}` }],
      });
    }

    try {
      const { hireDate, ...rest } = input;
      const row = await this.prisma.client.employee.update({
        where: { id },
        data: { ...rest, ...(hireDate && { hireDate: toDbDate(hireDate) }) },
      });
      return toEmployeeDto(row);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async setStatus(id: string, status: EmployeeStatus): Promise<EmployeeDto> {
    try {
      const row = await this.prisma.client.employee.update({ where: { id }, data: { status } });
      return toEmployeeDto(row);
    } catch (error) {
      throw this.translate(error);
    }
  }

  private translate(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return new ConflictException(EMAIL_TAKEN);
      if (error.code === "P2025") return new NotFoundException("Employee not found");
    }
    return error;
  }
}
