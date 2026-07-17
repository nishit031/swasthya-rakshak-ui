import { describe, it, expect } from "vitest";
import { buildMedicationPdf, type MedicationPdfLabels } from "../medication-pdf";
import type { MedicationExtraction } from "../medication/medication.schema";

const labels: MedicationPdfLabels = {
  documentTypeLabel: "Prescription",
  facilityLabel: "Facility",
  physicianLabel: "Physician",
  recordDateLabel: "Record date",
  generatedLabel: "Generated",
  summaryHeading: "Summary",
  medicationsHeading: "Medications",
  instructionsHeading: "Instructions",
  disclaimer: "AI-generated, not a medical diagnosis.",
  footer: "AI-generated. Consult your healthcare provider.",
  columns: {
    medication: "Medication",
    strength: "Strength",
    dose: "Dose",
    frequency: "Frequency",
    duration: "Duration",
    status: "Status"
  },
  statusLabels: {
    current: "Current",
    completed: "Completed",
    discontinued: "Discontinued",
    prn: "As needed",
    unknown: "Unknown"
  }
};

const extraction: MedicationExtraction = {
  kind: "medication",
  confidence: 84,
  generatedAt: new Date().toISOString(),
  medications: [
    {
      name: "Metformin",
      genericName: "metformin",
      brandName: "Glucophage",
      strength: "500 mg",
      dosage: { original: "1 tablet", normalized: "1 tablet" },
      route: "oral",
      frequency: { original: "twice daily", normalized: "twice daily" },
      duration: "30 days",
      quantity: "60 tablets",
      refills: "2",
      startDate: "2026-07-01",
      endDate: null,
      prn: false,
      instructions: "Take after meals",
      prescriber: "Dr. Rao",
      status: "current",
      confidence: 88,
      lowConfidenceFields: []
    }
  ]
};

describe("buildMedicationPdf", () => {
  it("produces a valid non-empty PDF with a medication table", async () => {
    const doc = await buildMedicationPdf(
      {
        title: "Prescription — Sunrise Clinic",
        documentType: "prescription",
        physician: "Dr. Rao",
        sourceName: "Sunrise Clinic",
        visitDate: "2026-07-09"
      },
      extraction,
      "## Overview\n\nOne medication identified.",
      labels
    );
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(bytes.slice(0, 4))).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("handles an empty medication list + null summary without throwing", async () => {
    const empty: MedicationExtraction = { ...extraction, medications: [] };
    const doc = await buildMedicationPdf(
      {
        title: "Empty",
        documentType: "prescription",
        physician: null,
        sourceName: null,
        visitDate: null
      },
      empty,
      null,
      labels
    );
    expect((doc.output("arraybuffer") as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });
});
