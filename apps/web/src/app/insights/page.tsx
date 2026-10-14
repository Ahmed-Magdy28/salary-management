"use client";

import { COUNTRIES } from "@salary/shared";
import { useState } from "react";
import { StatsTable } from "@/components/insights/stats-table";
import { EmptyState, ErrorState } from "@/components/states";
import { Card, Skeleton } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { useOverview, useSalaryStats } from "@/lib/hooks";
import { countryName, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "country" | "department" | "jobTitle";
const TABS: { id: Tab; label: string; groupLabel: string }[] = [
  { id: "country", label: "By country", groupLabel: "Country" },
  { id: "department", label: "By department", groupLabel: "Department" },
  { id: "jobTitle", label: "By job title", groupLabel: "Job title" },
];

export default function InsightsPage() {
  const [tab, setTab] = useState<Tab>("country");
  const [country, setCountry] = useState("US");
  const needsScope = tab !== "country";

  const overview = useOverview();
  const stats = useSalaryStats(tab, needsScope ? country : undefined);
  const current = TABS.find((t) => t.id === tab)!;

  const kpis = [
    { label: "Active employees", value: overview.data?.employees },
    { label: "Countries", value: overview.data?.countries },
    { label: "Departments", value: overview.data?.departments },
    { label: "Job titles", value: overview.data?.jobTitles },
  ];

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold leading-9">Salary insights</h1>
        <p className="mt-1 text-[15px] text-muted">How ACME pays people, in each country&apos;s own currency</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="min-w-[200px] flex-1 px-5 py-4">
            <div className="text-sm font-medium text-muted">{k.label}</div>
            {k.value === undefined ? (
              <Skeleton className="mt-2 h-9 w-24" />
            ) : (
              <div className="tabular mt-1 text-[34px] font-bold leading-[42px]">{formatNumber(k.value)}</div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Group salaries by" className="flex gap-1 rounded-xl bg-slate-200 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-11 rounded-[9px] px-4 text-[15px] font-semibold transition-colors",
                tab === t.id ? "bg-accent text-white" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {needsScope && (
          <label className="flex items-center gap-2.5 text-sm font-medium text-muted">
            Country
            <Select className="w-auto" value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>

      <Card className={cn("overflow-hidden", stats.isPlaceholderData && "opacity-60 transition-opacity")}>
        {stats.isPending ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : stats.isError ? (
          <div className="p-5">
            <ErrorState message={stats.error.message} onRetry={() => stats.refetch()} />
          </div>
        ) : stats.data.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No active employees in this selection" />
          </div>
        ) : (
          <StatsTable rows={stats.data} groupLabel={current.groupLabel} renderGroup={tab === "country" ? countryName : (g) => g} />
        )}
      </Card>

      <div className="flex flex-wrap gap-4 text-sm leading-[22px] text-slate-700">
        <Card className="min-w-[280px] flex-1 px-[18px] py-4">
          <b className="text-ink">How to read the bar</b>
          <br />
          The grey track runs from the lowest to the highest salary. The coloured section is the middle half (P25 to P75). The dark tick is the median.
        </Card>
        <Card className="min-w-[280px] flex-1 px-[18px] py-4">
          <b className="text-ink">Currencies are never mixed</b>
          <br />
          Every row uses its own country&apos;s currency. Department and job title views are scoped to one country so figures stay comparable.
        </Card>
      </div>
    </>
  );
}
