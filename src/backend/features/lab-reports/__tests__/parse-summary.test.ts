import { describe, it, expect } from "vitest";
import { parseSummary } from "../parse-summary";

const withAbnormal = `## Overall Summary

Most values are within normal limits with one mildly elevated result.

## Key Findings

* Hemoglobin normal
* Platelet count slightly elevated

## Abnormal Results

* Platelet Count: 410 K/uL (Reference 150-400) — mildly elevated, often temporary
* WBC: 12000 /uL — above range

## Normal Results

* Hemoglobin
* RBC

## Follow-up

Clinical interpretation should always be performed by a qualified healthcare professional.`;

const allNormal = `## Overall Summary

All parameters are within normal limits.

## Key Findings

* Everything looks normal

## Abnormal Results

* None apparent

## Normal Results

* Hemoglobin
* Platelet Count

## Follow-up

No immediately concerning findings are apparent from this report.`;

describe("parseSummary", () => {
  it("buckets each section and extracts bullets", () => {
    const p = parseSummary(withAbnormal);
    expect(p.overallSummary).toContain("normal limits");
    expect(p.keyFindings).toHaveLength(2);
    expect(p.abnormalResults).toHaveLength(2);
    expect(p.abnormalResults[0]).toContain("Platelet Count");
    expect(p.normalResults).toEqual(["Hemoglobin", "RBC"]);
    expect(p.followUp).toContain("healthcare professional");
    expect(p.hasAbnormal).toBe(true);
  });

  it("does not count negation placeholders as abnormal findings", () => {
    const p = parseSummary(allNormal);
    expect(p.abnormalResults).toHaveLength(0);
    expect(p.hasAbnormal).toBe(false);
    expect(p.normalResults).toEqual(["Hemoglobin", "Platelet Count"]);
  });
});
