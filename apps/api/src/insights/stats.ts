import { LOW_SAMPLE_THRESHOLD, type DistributionBand, type SalaryStatsRow, type SalarySummary } from "@salary/shared";

/** Shape returned by the percentile SQL; percentiles come back as floats. */
export interface RawStats {
  count: number;
  min: number;
  p25: number;
  median: number;
  mean: number;
  p75: number;
  max: number;
}

export interface RawGroupStats extends RawStats {
  group: string;
  currency: string;
}

export function toSummary(raw: RawStats): SalarySummary {
  return {
    count: raw.count,
    min: raw.min,
    p25: Math.round(raw.p25),
    median: Math.round(raw.median),
    mean: Math.round(raw.mean),
    p75: Math.round(raw.p75),
    max: raw.max,
  };
}

export function toStatsRow(raw: RawGroupStats): SalaryStatsRow {
  return {
    group: raw.group,
    currency: raw.currency,
    ...toSummary(raw),
    lowSample: raw.count < LOW_SAMPLE_THRESHOLD,
  };
}

export interface BucketCount {
  bucket: number;
  count: number;
}

/**
 * Builds `bands` even salary bands from `min` to `max` (inclusive integer ranges).
 * Bucket numbers are 1-based, as produced by PostgreSQL `width_bucket(salary, min, max + 1, bands)`.
 */
export function buildBands(min: number, max: number, bands: number, buckets: BucketCount[]): DistributionBand[] {
  const countByBucket = new Map(buckets.map((b) => [b.bucket, b.count]));

  if (min === max) {
    return [{ from: min, to: max, count: buckets.reduce((sum, b) => sum + b.count, 0) }];
  }

  const width = (max + 1 - min) / bands;
  return Array.from({ length: bands }, (_, i) => ({
    from: Math.ceil(min + i * width),
    to: i === bands - 1 ? max : Math.ceil(min + (i + 1) * width) - 1,
    count: countByBucket.get(i + 1) ?? 0,
  }));
}
