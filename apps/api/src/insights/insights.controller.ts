import { Controller, Get, Query } from "@nestjs/common";
import {
  distributionQuerySchema,
  salaryStatsQuerySchema,
  type DistributionDto,
  type DistributionQuery,
  type OverviewDto,
  type SalaryStatsQuery,
  type SalaryStatsRow,
} from "@salary/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { InsightsService } from "./insights.service";

@Controller("insights")
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get("overview")
  overview(): Promise<OverviewDto> {
    return this.insights.overview();
  }

  @Get("salary-stats")
  salaryStats(@Query(new ZodValidationPipe(salaryStatsQuerySchema)) query: SalaryStatsQuery): Promise<SalaryStatsRow[]> {
    return this.insights.salaryStats(query);
  }

  @Get("distribution")
  distribution(@Query(new ZodValidationPipe(distributionQuerySchema)) query: DistributionQuery): Promise<DistributionDto> {
    return this.insights.distribution(query);
  }
}
