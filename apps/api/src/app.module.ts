import { Module } from "@nestjs/common";
import { EmployeesModule } from "./employees/employees.module";
import { HealthController } from "./health/health.controller";
import { InsightsModule } from "./insights/insights.module";
import { MetaModule } from "./meta/meta.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, EmployeesModule, InsightsModule, MetaModule],
  controllers: [HealthController],
})
export class AppModule {}
