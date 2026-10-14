"use client";

import { COUNTRIES, COUNTRY_BY_CODE } from "@salary/shared";
import dynamic from "next/dynamic";
import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/states";
import { Card, Skeleton } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { useDistribution, useFilterOptions } from "@/lib/hooks";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

// Recharts is large; load it on demand so the page shell and controls appear first.
const DistributionChart = dynamic(() => import("@/components/insights/distribution-chart").then((m) => m.DistributionChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[340px] w-full" />,
});

export default function PaySpreadPage() {
  const [country, setCountry] = useState("US");
  const [jobTitle, setJobTitle] = useState("");
  const options = useFilterOptions();
  const distribution = useDistribution(country, jobTitle || undefined);
  const summary = distribution.data?.summary;

  const stats = summary
    ? [
        ["Employees", summary.count],
        ["Min", summary.min],
        ["P25", summary.p25],
        ["Median", summary.median],
        ["P75", summary.p75],
        ["Max", summary.max],
      ]
    : [];

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold leading-9">Pay spread</h1>
        <p className="mt-1 text-[15px] text-muted">See how salaries are distributed for one country and, optionally, one job title</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2.5 text-sm font-medium text-muted">
          Country *
          <Select className="w-auto" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2.5 text-sm font-medium text-muted">
          Job title
          <Select className="w-auto" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}>
            <option value="">All job titles</option>
            {options.data?.jobTitles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </label>
        <span className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">Currency: {COUNTRY_BY_CODE[country].currency}</span>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Card className={cn("min-w-0 flex-[3_1_560px] p-6", distribution.isPlaceholderData && "opacity-60 transition-opacity")}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold">Employees per salary band</h2>
            <div className="flex-1" />
            <span className="inline-flex items-center gap-2 text-[13px] text-muted">
              <span className="h-3 w-3 rounded-[3px] bg-accent" aria-hidden="true" />
              Band containing the median
            </span>
          </div>
          {distribution.isPending ? (
            <Skeleton className="h-[340px] w-full" />
          ) : distribution.isError ? (
            <ErrorState message={distribution.error.message} onRetry={() => distribution.refetch()} />
          ) : distribution.data.bands.length === 0 ? (
            <EmptyState title="No employees match this selection" hint="Try another job title or country." />
          ) : (
            <>
              <DistributionChart distribution={distribution.data} />
              <p className="mt-2 text-center text-[13px] text-muted">
                Annual salary in {distribution.data.currency} (even bands from lowest to highest)
              </p>
            </>
          )}
        </Card>

        <aside className="flex min-w-0 flex-[1_1_260px] flex-col gap-4">
          <Card className="p-5">
            <h2 className="mb-3 text-base font-bold">Summary</h2>
            {stats.length === 0 ? (
              <p className="text-sm text-muted">No data for this selection.</p>
            ) : (
              <dl className="space-y-1">
                {stats.map(([label, value]) => (
                  <div key={label} className={cn("flex justify-between rounded-lg px-3 py-2.5 text-[15px]", label === "Median" ? "bg-slate-200" : "bg-slate-50")}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="tabular font-bold">{formatNumber(value as number)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
