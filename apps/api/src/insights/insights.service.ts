import { Injectable } from "@nestjs/common";
import { Prisma } from "@salary/db";
import type {
  DistributionDto,
  DistributionQuery,
  OverviewDto,
  SalaryStatsQuery,
  SalaryStatsRow,
} from "@salary/shared";
import { COUNTRY_BY_CODE } from "@salary/shared";
import { PrismaService } from "../prisma/prisma.service";
import { buildBands, toStatsRow, toSummary, type BucketCount, type RawGroupStats, type RawStats } from "./stats";

/** Whitelist: the only column names ever interpolated into SQL. */
const GROUP_COLUMNS = {
  country: Prisma.raw('"country"'),
  department: Prisma.raw('"department"'),
  jobTitle: Prisma.raw('"jobTitle"'),
} as const;

const STATS_COLUMNS = Prisma.sql`
  COUNT(*)::int AS "count",
  MIN(salary)::int AS "min",
  percentile_cont(0.25) WITHIN GROUP (ORDER BY salary)::float8 AS "p25",
  percentile_cont(0.5) WITHIN GROUP (ORDER BY salary)::float8 AS "median",
  AVG(salary)::float8 AS "mean",
  percentile_cont(0.75) WITHIN GROUP (ORDER BY salary)::float8 AS "p75",
  MAX(salary)::int AS "max"`;

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<OverviewDto> {
    const [row] = await this.prisma.client.$queryRaw<OverviewDto[]>`
      SELECT COUNT(*)::int AS "employees",
             COUNT(DISTINCT country)::int AS "countries",
             COUNT(DISTINCT department)::int AS "departments",
             COUNT(DISTINCT "jobTitle")::int AS "jobTitles"
      FROM employees WHERE status = 'ACTIVE'`;
    return row;
  }

  async salaryStats(query: SalaryStatsQuery): Promise<SalaryStatsRow[]> {
    const column = GROUP_COLUMNS[query.groupBy];
    const scope = query.country ? Prisma.sql`AND country = ${query.country}` : Prisma.empty;
    const rows = await this.prisma.client.$queryRaw<RawGroupStats[]>(Prisma.sql`
      SELECT ${column} AS "group", MIN(currency) AS "currency", ${STATS_COLUMNS}
      FROM employees
      WHERE status = 'ACTIVE' ${scope}
      GROUP BY ${column}
      ORDER BY ${column} ASC`);
    return rows.map(toStatsRow);
  }

  async distribution(query: DistributionQuery): Promise<DistributionDto> {
    const currency = COUNTRY_BY_CODE[query.country].currency;
    const jobTitle = query.jobTitle ?? null;
    const scope = Prisma.sql`status = 'ACTIVE' AND country = ${query.country}
      ${jobTitle ? Prisma.sql`AND "jobTitle" = ${jobTitle}` : Prisma.empty}`;

    const [stats] = await this.prisma.client.$queryRaw<RawStats[]>(Prisma.sql`
      SELECT ${STATS_COLUMNS} FROM employees WHERE ${scope}`);

    if (!stats || stats.count === 0) {
      return { country: query.country, currency, jobTitle, summary: null, bands: [] };
    }

    const buckets = await this.prisma.client.$queryRaw<BucketCount[]>(Prisma.sql`
      SELECT width_bucket(salary::numeric, ${stats.min}::numeric, ${stats.max + 1}::numeric, ${query.bands}::int)::int AS "bucket",
             COUNT(*)::int AS "count"
      FROM employees WHERE ${scope}
      GROUP BY 1`);

    return {
      country: query.country,
      currency,
      jobTitle,
      summary: toSummary(stats),
      bands: buildBands(stats.min, stats.max, query.bands, buckets),
    };
  }
}
