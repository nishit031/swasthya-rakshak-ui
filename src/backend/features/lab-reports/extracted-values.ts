// Pure derivation logic for the Extracted Values dashboard: bucketing, an honest report-level
// quality score, AI-interpretation matching, and CSV/text export builders. No OCR/LLM calls here —
// this only interprets the already-extracted ExtractedData the pipeline already produced.

import { parseNumber, parseRange, classify } from "./lab-values";
import type { ExtractedTest } from "./lab-reports.types";
import type { ParsedSummary } from "./parse-summary";

export type ValueBucket = "normal" | "abnormal" | "unrated" | "review";

// OCR/LLM sometimes lands the abnormality FLAG letter in the value column ("L" instead of the
// measured number). Salvage deterministically: move it to flag (when flag is empty) and null the
// value — the row then reads as an honest "needs review" with a known direction, instead of
// displaying "L" as a result. Pure; returns a new object only when a fix applies.
const FLAG_LETTERS = /^(?:h|hh|l|ll)$/i;

export function sanitizeTest(test: ExtractedTest): ExtractedTest {
  const v = (test.value ?? "").trim();
  if (FLAG_LETTERS.test(v) && !(test.flag ?? "").trim()) {
    return { ...test, value: undefined, flag: v };
  }
  return test;
}

export function sanitizeTests(tests: ExtractedTest[]): ExtractedTest[] {
  return tests.map(sanitizeTest);
}

// Legitimate non-numeric lab results (urine/serology/qualitative tests). A value in this list is
// NOT an OCR error — only an empty or genuinely unparseable string (e.g. a garbled "L") is.
const CATEGORICAL_VALUES = new Set([
  "positive",
  "negative",
  "reactive",
  "non-reactive",
  "nonreactive",
  "present",
  "absent",
  "normal",
  "abnormal",
  "trace",
  "nil"
]);

export function isVerified(test: ExtractedTest): boolean {
  const v = (test.value ?? "").trim();
  if (!v) return false;
  if (parseNumber(v) != null) return true;
  return CATEGORICAL_VALUES.has(v.toLowerCase());
}

// review = OCR-garbled/empty (unverified). unrated = a correctly-extracted value with no printed
// reference range or flag to judge it against (common for derived ratios like TG/HDL) — the
// extraction succeeded, there's just nothing to compare to, so it doesn't read as an error.
export function bucketFor(test: ExtractedTest): ValueBucket {
  if (!isVerified(test)) return "review";
  const status = classify(parseNumber(test.value), parseRange(test.referenceRange), test.flag);
  if (status === "unknown") return "unrated";
  return status === "normal" ? "normal" : "abnormal";
}

export interface ValuesQuality {
  score: number;
  normalCount: number;
  abnormalCount: number;
  unratedCount: number;
  reviewCount: number;
}

// Honest "how much of this report did we actually make sense of" score — the fraction of tests
// whose value we extracted and verified (normal/abnormal/unrated), not a fabricated OCR
// confidence. Unrated counts toward the score: the value WAS extracted correctly, the report just
// prints no range for it. Only garbled/unreadable values (review) penalize.
// Deliberately separate from src/features/ai/extraction-confidence.ts, which scores a different
// thing (metadata field extraction from OCR text quality).
export function computeValuesQuality(tests: ExtractedTest[]): ValuesQuality {
  const counts = { normal: 0, abnormal: 0, unrated: 0, review: 0 };
  for (const test of tests) counts[bucketFor(test)]++;
  const total = tests.length;
  const judged = counts.normal + counts.abnormal + counts.unrated;
  const score = total === 0 ? 0 : Math.round((100 * judged) / total);
  return {
    score,
    normalCount: counts.normal,
    abnormalCount: counts.abnormal,
    unratedCount: counts.unrated,
    reviewCount: counts.review
  };
}

// Matches a test to a bullet in the already-generated AI summary: the bullet must explicitly
// contain the test's full name (case-insensitive substring, bullet-contains-name direction only).
// Checked in priority order — abnormal bullets are most likely to name a flagged test.
//
// Deliberately one-directional: an earlier reverse check ("does the test name contain the
// bullet's label") caused real false positives on compound test names — e.g. "VLDL Cholesterol"
// wrongly matched the "LDL Cholesterol" bullet (VLDL contains "LDL" as a substring), and
// "Non-HDL Cholesterol" wrongly matched the "HDL Cholesterol" bullet. A missed match (no
// interpretation shown) is the correct failure mode for this heuristic; a wrong match attributing
// one test's explanation to a different test is not — never fabricates or misattributes.
export function matchInterpretation(testName: string, parsed: ParsedSummary | null): string | null {
  const name = testName.trim().toLowerCase();
  if (!parsed || !name) return null;
  const buckets = [parsed.abnormalResults, parsed.keyFindings, parsed.normalResults];
  for (const bullets of buckets) {
    for (const bullet of bullets) {
      if (bullet.toLowerCase().includes(name)) return bullet;
    }
  }
  return null;
}

function csvEscape(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildValuesCsv(tests: ExtractedTest[]): string {
  const header = "Test,Value,Unit,Reference Range,Status,Verified";
  const rows = tests.map((t) => {
    const status = classify(parseNumber(t.value), parseRange(t.referenceRange), t.flag);
    return [
      t.name ?? "",
      t.value ?? "",
      t.unit ?? "",
      t.referenceRange ?? "",
      status,
      isVerified(t) ? "Yes" : "No"
    ]
      .map((v) => csvEscape(String(v)))
      .join(",");
  });
  return [header, ...rows].join("\n");
}

export function buildValuesText(tests: ExtractedTest[]): string {
  return tests
    .map((t) => {
      const value = `${t.value ?? "—"}${t.unit ? ` ${t.unit}` : ""}`;
      const range = t.referenceRange ? ` (Reference: ${t.referenceRange})` : "";
      return `${t.name ?? "Unnamed test"}: ${value}${range}`;
    })
    .join("\n");
}
