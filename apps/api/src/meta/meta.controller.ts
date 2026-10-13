import { Controller, Get } from "@nestjs/common";
import { COUNTRIES, DEPARTMENTS, type FilterOptionsDto } from "@salary/shared";
import { PrismaService } from "../prisma/prisma.service";

@Controller("meta")
export class MetaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("filters")
  async filters(): Promise<FilterOptionsDto> {
    const titles = await this.prisma.client.employee.findMany({
      distinct: ["jobTitle"],
      select: { jobTitle: true },
      orderBy: { jobTitle: "asc" },
    });
    return {
      countries: COUNTRIES.map((c) => ({ ...c })),
      departments: [...DEPARTMENTS],
      jobTitles: titles.map((t) => t.jobTitle),
    };
  }
}
