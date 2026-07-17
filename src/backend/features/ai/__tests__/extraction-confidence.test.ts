import { describe, it, expect } from "vitest";
import { computeExtractionConfidence, scoreExtraction } from "../extraction-confidence";

const cleanOcr =
  "Complete Blood Count report from SRL Diagnostics dated 08 July 2026. " +
  "Hemoglobin 13.5 g/dL, Platelet Count 410 K/uL, WBC 7200 /uL, all values reviewed by lab.";

describe("computeExtractionConfidence", () => {
  it("scores high when all fields are present and OCR text is clean", () => {
    const { score, lowConfidenceFields } = computeExtractionConfidence(cleanOcr, {
      testName: "Complete Blood Count",
      labName: "SRL Diagnostics",
      reportDate: "2026-07-08"
    });
    expect(score).toBeGreaterThanOrEqual(85);
    expect(lowConfidenceFields).toHaveLength(0);
  });

  it("scores low and flags fields when extraction is empty and OCR is garbled", () => {
    const { score, lowConfidenceFields } = computeExtractionConfidence("§#%@ ~~ ||| ¿¿", {
      testName: null,
      labName: null,
      reportDate: null
    });
    expect(score).toBeLessThan(60);
    expect(lowConfidenceFields).toEqual(["testName", "labName", "reportDate"]);
  });

  it("flags only the missing field on an otherwise good extraction", () => {
    const { lowConfidenceFields } = computeExtractionConfidence(cleanOcr, {
      testName: "Complete Blood Count",
      labName: null,
      reportDate: "2026-07-08"
    });
    expect(lowConfidenceFields).toEqual(["labName"]);
  });
});

describe("scoreExtraction (generic — any field set)", () => {
  it("works with a field set other than the lab's fixed three", () => {
    const { score, lowConfidenceFields } = scoreExtraction(cleanOcr, {
      documentType: "discharge_summary",
      title: "Discharge Summary",
      facility: "Apollo Hospital",
      physician: "Dr. Rao",
      recordDate: "2026-07-08"
    });
    expect(score).toBeGreaterThanOrEqual(85);
    expect(lowConfidenceFields).toHaveLength(0);
  });

  it("flags missing fields regardless of field name", () => {
    const { lowConfidenceFields } = scoreExtraction(cleanOcr, {
      documentType: "prescription",
      physician: null
    });
    expect(lowConfidenceFields).toEqual(["physician"]);
  });
});
