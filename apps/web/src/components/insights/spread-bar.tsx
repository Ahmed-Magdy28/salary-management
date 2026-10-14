import type { SalaryStatsRow } from "@salary/shared";

type Range = Pick<SalaryStatsRow, "min" | "p25" | "median" | "p75" | "max">;

/** Percent positions of the P25-P75 band and the median tick between min and max. */
export function spreadPositions(row: Range): { bandLeft: number; bandWidth: number; median: number } {
  const span = row.max - row.min;
  if (span <= 0) return { bandLeft: 0, bandWidth: 100, median: 50 };
  const pct = (value: number) => ((value - row.min) / span) * 100;
  return { bandLeft: pct(row.p25), bandWidth: pct(row.p75) - pct(row.p25), median: pct(row.median) };
}

export function SpreadBar({ row }: { row: Range }) {
  const { bandLeft, bandWidth, median } = spreadPositions(row);
  return (
    <div className="relative flex h-4 items-center" role="img" aria-label={`Typical range ${row.p25} to ${row.p75}, median ${row.median}`}>
      <div className="absolute inset-x-0 h-1.5 rounded-sm bg-slate-200" />
      <div className="absolute h-2.5 rounded-full bg-accent" style={{ left: `${bandLeft}%`, width: `${Math.max(bandWidth, 1.5)}%` }} />
      <div className="absolute h-4 w-[3px] rounded-sm bg-ink" style={{ left: `${median}%` }} />
    </div>
  );
}
