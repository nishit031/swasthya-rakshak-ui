// Groups extracted lab values across multiple reports into per-test time series, for the Trends
// view. Pure data shaping — reuses the same parsing/classification lab-values.ts already uses for
// the per-report values table, so a value is judged identically whether shown in one report or
// across many.

import type { LabReport } from "./lab-reports.types";
import { parseNumber, parseRange, classify, type Status } from "./lab-values";

export interface TrendPoint {
  date: Date;
  value: number;
  unit: string | null;
  low: number | null;
  high: number | null;
  status: Status;
}

export interface TrendSeries {
  testName: string;
  points: TrendPoint[]; // sorted ascending by date
}

// A trend needs at least two data points to say anything about change over time.
const MIN_POINTS = 2;

// Builds one series per distinct test name (case-insensitive) found across all reports' extracted
// values, keeping only series with enough numeric, dated points to plot. Newest-tested series
// first, since that's usually what the reader is checking in on.
export function buildTrendSeries(labs: LabReport[]): TrendSeries[] {
  const groups = new Map<string, { displayName: string; points: TrendPoint[] }>();

  for (const lab of labs) {
    if (!lab.reportDate || !lab.extractedDataJson?.tests) continue;
    const date = new Date(lab.reportDate);
    if (Number.isNaN(date.getTime())) continue;

    for (const test of lab.extractedDataJson.tests) {
      const name = test.name?.trim();
      if (!name) continue;
      const value = parseNumber(test.value);
      if (value == null) continue;

      const range = parseRange(test.referenceRange);
      const status = classify(value, range, test.flag);
      const key = name.toLowerCase();
      if (!groups.has(key)) groups.set(key, { displayName: name, points: [] });
      groups.get(key)!.points.push({
        date,
        value,
        unit: test.unit ?? null,
        low: range.low,
        high: range.high,
        status
      });
    }
  }

  return Array.from(groups.values())
    .map(({ displayName, points }) => ({
      testName: displayName,
      points: points.slice().sort((a, b) => a.date.getTime() - b.date.getTime())
    }))
    .filter((series) => series.points.length >= MIN_POINTS)
    .sort((a, b) => {
      const aLast = a.points[a.points.length - 1].date.getTime();
      const bLast = b.points[b.points.length - 1].date.getTime();
      return bLast - aLast;
    });
}
