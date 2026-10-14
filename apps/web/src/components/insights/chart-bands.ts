import type { DistributionDto } from "@salary/shared";
import { formatCompact, formatMoney } from "@/lib/format";

export interface ChartBand {
  label: string;
  range: string;
  count: number;
  hasMedian: boolean;
}

/** One chart bar per salary band; the band holding the median is flagged. */
export function toChartBands(distribution: DistributionDto): ChartBand[] {
  const median = distribution.summary?.median;
  return distribution.bands.map((band) => ({
    label: band.from === band.to ? formatCompact(band.from) : `${formatCompact(band.from)}-${formatCompact(band.to)}`,
    range: `${formatMoney(band.from, distribution.currency)} to ${formatMoney(band.to, distribution.currency)}`,
    count: band.count,
    hasMedian: median !== undefined && median >= band.from && median <= band.to,
  }));
}
