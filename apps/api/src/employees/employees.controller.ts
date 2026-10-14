import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createEmployeeSchema,
  importRequestSchema,
  listEmployeesQuerySchema,
  setStatusSchema,
  updateEmployeeSchema,
  type CreateEmployeeInput,
  type EmployeeDto,
  type ImportRequest,
  type ImportResultDto,
  type ListEmployeesQuery,
  type Paginated,
  type UpdateEmployeeInput,
} from "@salary/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { EmployeeImportService } from "./employee-import.service";
import { EmployeesService } from "./employees.service";

@Controller("employees")
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly imports: EmployeeImportService,
  ) {}

  @Get()
  list(@Query(new ZodValidationPipe(listEmployeesQuerySchema)) query: ListEmployeesQuery): Promise<Paginated<EmployeeDto>> {
    return this.employees.list(query);
  }

  /** Declared before `:id` routes so "import" is never read as an id. */
  @Post("import")
  @HttpCode(200)
  importEmployees(@Body(new ZodValidationPipe(importRequestSchema)) body: ImportRequest): Promise<ImportResultDto> {
    return this.imports.importEmployees(body);
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<EmployeeDto> {
    return this.employees.findOne(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(createEmployeeSchema)) body: CreateEmployeeInput): Promise<EmployeeDto> {
    return this.employees.create(body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateEmployeeSchema)) body: UpdateEmployeeInput,
  ): Promise<EmployeeDto> {
    return this.employees.update(id, body);
  }

  @Patch(":id/status")
  @HttpCode(200)
  setStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setStatusSchema)) body: { status: "ACTIVE" | "INACTIVE" },
  ): Promise<EmployeeDto> {
    return this.employees.setStatus(id, body.status);
  }
}
