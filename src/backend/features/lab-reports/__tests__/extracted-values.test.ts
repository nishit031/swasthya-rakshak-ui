import { describe, it, expect } from "vitest";
import {
  isVerified,
  bucketFor,
  computeValuesQuality,
  matchInterpretation,
  sanitizeTest,
  sanitizeTests,
  buildValuesCsv,
  buildValuesText
} from "../extracted-values";
import { parseSummary } from "../parse-summary";
import type { ExtractedTest } from "../lab-reports.types";

describe("isVerified", () => {
  it("verifies a numeric value", () => {
    expect(isVerified({ value: "410 K/uL" })).toBe(true);
  });
  it("verifies a legitimate categorical result (not an OCR error)", () => {
    expect(isVerified({ value: "Positive" })).toBe(true);
    expect(isVerified({ value: "negative" })).toBe(true);
  });
  it("does not verify empty or garbled values", () => {
    expect(isVerified({ value: "" })).toBe(false);
    expect(isVerified({ value: "L" })).toBe(false);
    expect(isVerified({})).toBe(false);
  });
});

describe("bucketFor", () => {
  it("buckets a value within range as normal", () => {
    expect(bucketFor({ value: "55", referenceRange: "35-80" })).toBe("normal");
  });
  it("buckets an out-of-range value as abnormal", () => {
    expect(bucketFor({ value: "410", referenceRange: "150-400" })).toBe("abnormal");
  });
  it("buckets an unverified (garbled) value as review", () => {
    expect(bucketFor({ value: "L" })).toBe("review");
  });
  it("buckets a verified value with no range/flag as unrated, not review or abnormal", () => {
    expect(bucketFor({ value: "42" })).toBe("unrated");
    expect(bucketFor({ value: "3.13", name: "TG/HDL Ratio" })).toBe("unrated");
  });
  it("buckets a verified categorical value with an explicit flag correctly", () => {
    expect(bucketFor({ value: "Positive", flag: "H" })).toBe("abnormal");
  });
});

describe("sanitizeTest", () => {
  it("moves a flag letter extracted as the value into flag", () => {
    const fixed = sanitizeTest({ name: "TC/HDL Ratio", value: "L", referenceRange: "3.5-5" });
    expect(fixed.value).toBeUndefined();
    expect(fixed.flag).toBe("L");
  });
  it("handles double-letter flags case-insensitively", () => {
    expect(sanitizeTest({ value: "hh" }).flag).toBe("hh");
  });
  it("does not touch a row that already has a flag", () => {
    const t = { value: "L", flag: "H" };
    expect(sanitizeTest(t)).toBe(t);
  });
  it("does not touch real values", () => {
    const t = { value: "5.5", referenceRange: "3.5-5" };
    expect(sanitizeTest(t)).toBe(t);
    const cat = { value: "Positive" };
    expect(sanitizeTests([cat])[0]).toBe(cat);
  });
});

describe("computeValuesQuality", () => {
  it("scores 100 when every test is judgeable", () => {
    const tests: ExtractedTest[] = [
      { value: "55", referenceRange: "35-80" },
      { value: "410", referenceRange: "150-400" }
    ];
    const q = computeValuesQuality(tests);
    expect(q.score).toBe(100);
    expect(q.normalCount).toBe(1);
    expect(q.abnormalCount).toBe(1);
    expect(q.reviewCount).toBe(0);
  });
  it("lowers the score only for unverified tests; unrated counts as judged", () => {
    const tests: ExtractedTest[] = [
      { value: "55", referenceRange: "35-80" },
      { value: "L" },
      { value: "42" }
    ];
    const q = computeValuesQuality(tests);
    expect(q.score).toBe(67);
    expect(q.reviewCount).toBe(1);
    expect(q.unratedCount).toBe(1);
  });
  it("returns 0 for an empty test list", () => {
    expect(computeValuesQuality([]).score).toBe(0);
  });
  it("scores the reported lipid-panel case at 89 after salvage (only the flag-letter row reviews)", () => {
    // Regression for the report that scored 67%: two range-less ratios must not penalize, and the
    // "L"-as-value row is salvaged to a flagged review row.
    const tests = sanitizeTests([
      { name: "Total Cholesterol/HDL Ratio", value: "L", referenceRange: "3.5-5" },
      { name: "TG/HDL Ratio", value: "3.13" },
      { name: "Non-HDL Cholesterol", value: "125.00", unit: "mg/dl" },
      { name: "Total Cholesterol", value: "180", referenceRange: "125-200" },
      { name: "Triglycerides", value: "172", referenceRange: "25-200" },
      { name: "HDL Cholesterol", value: "55", referenceRange: "35-80" },
      { name: "LDL Cholesterol", value: "90.60", referenceRange: "85-130" },
      { name: "VLDL Cholesterol", value: "34.40", referenceRange: "5-40" },
      { name: "LDL/HDL Ratio", value: "1.65", referenceRange: "1.5-3.5" }
    ]);
    const q = computeValuesQuality(tests);
    expect(q.normalCount).toBe(6);
    expect(q.unratedCount).toBe(2);
    expect(q.reviewCount).toBe(1);
    expect(q.score).toBe(89);
  });
});

describe("matchInterpretation", () => {
  const summary = `## Overall Summary

Most values are normal.

## Abnormal Results

* Platelet Count: 410 K/uL (Reference 150-400) — mildly elevated

## Normal Results

* Hemoglobin`;
  const parsed = parseSummary(summary);

  it("matches a test to an abnormal-results bullet", () => {
    expect(matchInterpretation("Platelet Count", parsed)).toContain("mildly elevated");
  });
  it("matches a test to a normal-results bullet", () => {
    expect(matchInterpretation("Hemoglobin", parsed)).toBe("Hemoglobin");
  });
  it("returns null when there is no summary", () => {
    expect(matchInterpretation("Platelet Count", null)).toBeNull();
  });
  it("returns null when nothing matches", () => {
    expect(matchInterpretation("Uric Acid", parsed)).toBeNull();
  });

  it("does not falsely match a compound test name to a shorter test's bullet", () => {
    // Regression: "VLDL Cholesterol" must not match the "LDL Cholesterol" bullet just because
    // "VLDL" contains "LDL" as a substring.
    const p = parseSummary(`## Key Findings

* LDL Cholesterol: 90.60 mg/dl (normal: 85-130 mg/dl)
* VLDL Cholesterol: 34.40 mg/dl (normal: 5-40 mg/dl)`);
    expect(matchInterpretation("VLDL Cholesterol", p)).toContain("VLDL");
    expect(matchInterpretation("VLDL Cholesterol", p)).not.toContain("90.60");
  });

  it("does not falsely match a hyphen-prefixed test name to the base test's bullet", () => {
    // Regression: "Non-HDL Cholesterol" must not match the "HDL Cholesterol" bullet.
    const p = parseSummary(`## Key Findings

* HDL Cholesterol: 55 mg/dl (normal: 35-80 mg/dl)
* Non-HDL Cholesterol: 125.00 mg/dl (calculated from total cholesterol and HDL)`);
    expect(matchInterpretation("Non-HDL Cholesterol", p)).toContain("125.00");
    expect(matchInterpretation("Non-HDL Cholesterol", p)).not.toContain("55 mg/dl");
  });
});

describe("buildValuesCsv", () => {
  it("produces a header row and one row per test", () => {
    const csv = buildValuesCsv([
      { name: "HDL", value: "55", unit: "mg/dL", referenceRange: "35-80" }
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Test,Value,Unit,Reference Range,Status,Verified");
    expect(lines[1]).toBe("HDL,55,mg/dL,35-80,normal,Yes");
  });
  it("escapes commas in fields", () => {
    const csv = buildValuesCsv([{ name: "Test, special", value: "1" }]);
    expect(csv).toContain('"Test, special"');
  });
});

describe("buildValuesText", () => {
  it("renders a readable line per test", () => {
    const text = buildValuesText([
      { name: "HDL", value: "55", unit: "mg/dL", referenceRange: "35-80" }
    ]);
    expect(text).toBe("HDL: 55 mg/dL (Reference: 35-80)");
  });
});
