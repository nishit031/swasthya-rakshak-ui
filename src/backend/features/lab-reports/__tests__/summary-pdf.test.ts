import { describe, it, expect } from "vitest";
import { buildSummaryPdf, type SummaryPdfLabels } from "../summary-pdf";
import { parseSummary } from "../parse-summary";

const labels: SummaryPdfLabels = {
  labLabel: "Lab",
  reportDateLabel: "Report date",
  generatedLabel: "Generated",
  overallStatus: "Overall status",
  keyFindings: "Key findings",
  abnormalResults: "Abnormal results",
  normalResults: "Normal results",
  followUp: "Follow-up",
  disclaimer: "AI-generated summary, not a medical diagnosis.",
  footer:
    "AI-generated summary. This document is not a medical diagnosis. Please consult your healthcare provider."
};

const summary = `## Overall Summary

Most values are within normal limits with one mildly elevated result.

## Key Findings

* Hemoglobin normal
* Platelet count slightly elevated

## Abnormal Results

* Platelet Count: 410 K/uL (Reference 150-400) — mildly elevated

## Normal Results

* Hemoglobin
* RBC

## Follow-up

Clinical interpretation should always be performed by a qualified healthcare professional.`;

describe("buildSummaryPdf", () => {
  it("produces a non-empty PDF for a parsed summary", async () => {
    const doc = await buildSummaryPdf(
      { testName: "CBC", labName: "SRL Diagnostics", reportDate: "2026-07-08" },
      parseSummary(summary),
      labels
    );
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    expect(bytes.byteLength).toBeGreaterThan(0);
    // %PDF magic header.
    expect(new Uint8Array(bytes.slice(0, 4))).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("handles an empty/minimal summary without throwing", async () => {
    const doc = await buildSummaryPdf(
      { testName: null, labName: null, reportDate: null },
      parseSummary(""),
      labels
    );
    expect((doc.output("arraybuffer") as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });
});
