import { z } from "zod";
import { COUNTRY_CODES } from "../constants";

export const STATS_GROUPS = ["country", "department", "jobTitle"] as const;

export const salaryStatsQuerySchema = z
  .object({
    groupBy: z.enum(STATS_GROUPS),
    country: z.enum(COUNTRY_CODES).optional(),
  })
  .superRefine((q, ctx) => {
    // Salaries are in local currency, so anything other than a per-country view
    // needs a country scope to avoid mixing currencies.
    if (q.groupBy !== "country" && !q.country) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["country"],
        message: "Select a country: figures are only comparable within one currency",
      });
    }
  });

export const distributionQuerySchema = z.object({
  country: z.enum(COUNTRY_CODES),
  jobTitle: z.string().trim().min(1).max(100).optional(),
  bands: z.coerce.number().int().min(2).max(30).default(10),
});

export type SalaryStatsQuery = z.infer<typeof salaryStatsQuerySchema>;
export type DistributionQuery = z.infer<typeof distributionQuerySchema>;
