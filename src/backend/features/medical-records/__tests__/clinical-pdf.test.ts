import { describe, it, expect } from "vitest";
import { buildClinicalPdf, type ClinicalPdfLabels } from "../clinical-pdf";
import { getClinicalConfig } from "../clinical/clinical.registry";
import type { ClinicalExtraction } from "../clinical/clinical.schema";

const config = getClinicalConfig("doctor_note")!;

const labels: ClinicalPdfLabels = {
  documentTypeLabel: "Doctor Note",
  facilityLabel: "Facility",
  physicianLabel: "Physician",
  recordDateLabel: "Record date",
  generatedLabel: "Generated",
  summaryHeading: "Summary",
  disclaimer: "AI-generated summary, not a medical diagnosis.",
  footer: "AI-generated summary. Please consult your healthcare provider.",
  sectionLabels: Object.fromEntries(config.sections.map((s) => [s.key, s.key]))
};

const extraction: ClinicalExtraction = {
  kind: "clinical",
  sections: {
    chief_complaint: "Persistent cough for 3 days",
    diagnosis: "Acute bronchitis",
    medications: ["Amoxicillin 500mg", "Paracetamol 650mg"],
    follow_up: "Return in 1 week if not improving"
  },
  confidence: 82,
  missingSections: ["visit_reason"],
  generatedAt: new Date().toISOString()
};

const record = {
  title: "Doctor Note — City Clinic",
  documentType: "doctor_note",
  physician: "Dr. Rao",
  sourceName: "City Clinic",
  visitDate: "2026-07-09"
};

describe("buildClinicalPdf", () => {
  it("produces a valid non-empty PDF with summary + sections", async () => {
    const doc = await buildClinicalPdf(
      record,
      config,
      extraction,
      "## Summary\n\nMild bronchitis.",
      labels
    );
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(bytes.slice(0, 4))).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("handles a null summary and empty sections without throwing", async () => {
    const empty: ClinicalExtraction = { ...extraction, sections: {}, missingSections: [] };
    const doc = await buildClinicalPdf(record, config, empty, null, labels);
    expect((doc.output("arraybuffer") as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });
});
