import { describe, it, expect } from "vitest";
import { buildExtractedDataPdf, type ExtractedDataPdfLabels } from "../extracted-data-pdf";

const labels: ExtractedDataPdfLabels = {
  labLabel: "Lab",
  reportDateLabel: "Report date",
  extractedLabel: "Extracted",
  reference: "Reference",
  status: "Status",
  verified: "Verified",
  notVerified: "Unverified",
  disclaimer: "AI-generated, not a diagnosis.",
  footer:
    "AI-generated summary. This document is not a medical diagnosis. Please consult your healthcare provider."
};

describe("buildExtractedDataPdf", () => {
  it("produces a non-empty, valid PDF for a list of tests", async () => {
    const doc = await buildExtractedDataPdf(
      { testName: "Lipid Profile", labName: "SRL Diagnostics", reportDate: "2026-07-08" },
      [
        { name: "HDL Cholesterol", value: "55", unit: "mg/dL", referenceRange: "35-80" },
        { name: "Total Chol/HDL Ratio", value: "L" }
      ],
      ["Your HDL falls within the recommended range.", null],
      labels
    );
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(bytes.slice(0, 4))).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("handles an empty test list without throwing", async () => {
    const doc = await buildExtractedDataPdf(
      { testName: null, labName: null, reportDate: null },
      [],
      [],
      labels
    );
    expect((doc.output("arraybuffer") as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });
});
