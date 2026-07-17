import { describe, it, expect } from "vitest";
import { buildImagingPdf, type ImagingPdfLabels } from "../imaging-pdf";
import { validateImaging, type ImagingExtraction } from "../imaging/imaging.schema";

const labels: ImagingPdfLabels = {
  documentTypeLabel: "MRI Report",
  modalityLabel: "MRI",
  facilityLabel: "Facility",
  radiologistLabel: "Radiologist",
  regionsLabel: "Regions",
  recordDateLabel: "Report date",
  generatedLabel: "Generated",
  summaryHeading: "Summary",
  findingsHeading: "Findings",
  measurementsHeading: "Measurements",
  impressionHeading: "Impression",
  recommendationsHeading: "Recommended follow-up",
  normalFindingsHeading: "Normal findings",
  disclaimer: "AI-generated summary, not a medical diagnosis.",
  footer: "AI-generated summary. Please consult your healthcare provider.",
  findingColumns: {
    finding: "Finding",
    location: "Location",
    severity: "Severity",
    measurement: "Measurement"
  },
  measurementColumns: { measurement: "Measurement", location: "Location", associated: "Associated" }
};

const extraction: ImagingExtraction = validateImaging(
  {
    exam: "MRI Brain",
    regions: ["brain"],
    findings: [
      {
        finding: "pulmonary nodule",
        location: "right frontal lobe",
        severity: "mild",
        measurement: "3 mm",
        sourceText: "3 mm nodule."
      }
    ],
    measurements: [
      { value: "3", unit: "mm", associatedFinding: "nodule", location: "frontal lobe" }
    ],
    impression: ["Benign-appearing nodule"],
    recommendations: ["Follow-up MRI in 6 months"],
    normalFindings: ["No acute intracranial abnormality"]
  },
  "MRI brain report text"
);

const record = {
  title: "MRI Brain — City Imaging",
  documentType: "mri_report",
  sourceName: "City Imaging",
  visitDate: "2026-07-09"
};

describe("buildImagingPdf", () => {
  it("produces a valid non-empty PDF with tables + sections", async () => {
    const doc = await buildImagingPdf(
      record,
      extraction,
      "## Overview\n\nA small spot was seen.",
      labels
    );
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(bytes.slice(0, 4))).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("handles a null summary and empty extraction without throwing", async () => {
    const empty = validateImaging({}, "x");
    const doc = await buildImagingPdf(record, empty, null, labels);
    expect((doc.output("arraybuffer") as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });
});
