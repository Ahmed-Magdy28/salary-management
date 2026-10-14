import { Injectable } from "@nestjs/common";
import { partitionImportRows, type ImportFailure, type ImportRequest, type ImportResultDto } from "@salary/shared";
import { PrismaService } from "../prisma/prisma.service";
import { chunk } from "./employee-import";

const BATCH_SIZE = 1000;

@Injectable()
export class EmployeeImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Imports the valid rows in one transaction (all or nothing for the valid set).
   * Invalid rows, repeated emails and emails that already exist are reported, never silently changed.
   */
  async importEmployees(request: ImportRequest): Promise<ImportResultDto> {
    const { valid, failed } = partitionImportRows(request.rows);
    const db = this.prisma.client;

    const existing = new Set<string>();
    for (const emails of chunk(valid.map((v) => v.data.email), BATCH_SIZE)) {
      const found = await db.employee.findMany({ where: { email: { in: emails } }, select: { email: true } });
      found.forEach((f) => existing.add(f.email));
    }

    const toCreate = valid.filter((v) => {
      if (!existing.has(v.data.email)) return true;
      failed.push({
        row: v.row,
        email: v.data.email,
        errors: [{ path: "email", message: "An employee with this email already exists" }],
      });
      return false;
    });

    let created = 0;
    if (toCreate.length > 0) {
      const results = await db.$transaction(
        chunk(toCreate, BATCH_SIZE).map((batch) =>
          db.employee.createMany({
            // skipDuplicates guards against a concurrent insert between the check above and now.
            skipDuplicates: true,
            data: batch.map(({ data }) => ({ ...data, hireDate: new Date(`${data.hireDate}T00:00:00Z`) })),
          }),
        ),
      );
      created = results.reduce((sum, r) => sum + r.count, 0);
    }

    const sorted: ImportFailure[] = failed.sort((a, b) => a.row - b.row);
    return { total: request.rows.length, created, failed: sorted };
  }
}
