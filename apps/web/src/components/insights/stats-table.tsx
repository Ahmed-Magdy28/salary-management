import type { SalaryStatsRow } from "@salary/shared";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SpreadBar } from "./spread-bar";

const GRID = "grid grid-cols-[1.7fr_.7fr_1fr_1fr_1fr_1fr_1fr_1.1fr_1.9fr] gap-3 px-5";

interface Props {
  rows: SalaryStatsRow[];
  groupLabel: string;
  renderGroup: (group: string) => string;
}

export function StatsTable({ rows, groupLabel, renderGroup }: Props) {
  const heads = ["Staff", "Min", "P25", "Median", "Mean", "P75", "Max"];
  return (
    <div className="overflow-x-auto" role="table" aria-label={`Salary statistics by ${groupLabel}`}>
      <div className="min-w-[1180px]">
        <div role="row" className={cn(GRID, "border-b border-line bg-slate-50 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted")}>
          <div role="columnheader">{groupLabel}</div>
          {heads.map((h) => (
            <div key={h} role="columnheader" className="text-right">
              {h}
            </div>
          ))}
          <div role="columnheader">Spread</div>
        </div>
        {rows.map((r) => (
          <div key={r.group} role="row" className={cn(GRID, "items-center border-b border-slate-100 py-3.5 text-[15px]")}>
            <div role="cell">
              <span className="font-semibold">{renderGroup(r.group)}</span> <span className="text-[13px] text-muted">{r.currency}</span>
              {r.lowSample && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800" title="Fewer than 5 people: treat figures with care">
                  Low sample
                </span>
              )}
            </div>
            <div role="cell" className="tabular text-right">{formatNumber(r.count)}</div>
            <div role="cell" className="tabular text-right">{formatNumber(r.min)}</div>
            <div role="cell" className="tabular text-right">{formatNumber(r.p25)}</div>
            <div role="cell" className="tabular text-right font-bold">{formatNumber(r.median)}</div>
            <div role="cell" className="tabular text-right">{formatNumber(r.mean)}</div>
            <div role="cell" className="tabular text-right">{formatNumber(r.p75)}</div>
            <div role="cell" className="tabular text-right">{formatNumber(r.max)}</div>
            <div role="cell">
              <SpreadBar row={r} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
