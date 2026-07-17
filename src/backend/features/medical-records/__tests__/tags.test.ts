import { describe, it, expect } from "vitest";
import { deriveTags } from "../tags";
import type { MedicalExtraction } from "../medical-records.types";

describe("deriveTags", () => {
  it("returns just the group tag for an unprocessed record", () => {
    const tags = deriveTags("xray_report", null);
    expect(tags).toHaveLength(1);
    expect(tags[0].filter).toEqual({ category: ["imaging"] });
  });

  it("adds a Referral tag for referral_note regardless of processing state", () => {
    const tags = deriveTags("referral_note", null);
    expect(tags.some((t) => t.label === "Referral")).toBe(true);
  });

  it("derives condition keyword tags from clinical diagnosis sections", () => {
    const extraction: MedicalExtraction = {
      kind: "clinical",
      sections: { primary_diagnosis: "Type 2 Diabetes with Hypertension" },
      confidence: 90,
      missingSections: [],
      generatedAt: new Date().toISOString()
    };
    const tags = deriveTags("diagnosis", extraction);
    const labels = tags.map((t) => t.label);
    expect(labels).toContain("Diabetes");
    expect(labels).toContain("Hypertension");
  });

  it("tags a medication record with a Medication chip when it has medications", () => {
    const extraction: MedicalExtraction = {
      kind: "medication",
      medications: [
        {
          name: "Metformin",
          genericName: null,
          brandName: null,
          strength: null,
          dosage: { original: null, normalized: null },
          route: null,
          frequency: { original: null, normalized: null },
          duration: null,
          quantity: null,
          refills: null,
          startDate: null,
          endDate: null,
          prn: null,
          instructions: null,
          prescriber: null,
          status: "current",
          confidence: 80,
          lowConfidenceFields: []
        }
      ],
      confidence: 80,
      generatedAt: new Date().toISOString()
    };
    const tags = deriveTags("prescription", extraction);
    expect(tags.some((t) => t.label === "Medication")).toBe(true);
  });

  it("tags imaging with its modality", () => {
    const extraction: MedicalExtraction = {
      kind: "imaging",
      exam: null,
      indication: null,
      technique: null,
      comparison: null,
      radiologist: null,
      reportDate: null,
      regions: [],
      findings: [],
      measurements: [],
      impression: [],
      recommendations: [],
      normalFindings: [],
      confidence: 80,
      generatedAt: new Date().toISOString()
    };
    const tags = deriveTags("mri_report", extraction);
    expect(tags.some((t) => t.label === "MRI")).toBe(true);
  });

  it("tags a procedure with Surgery + a known outcome status", () => {
    const extraction: MedicalExtraction = {
      kind: "procedure",
      procedureName: "Appendectomy",
      procedureCategory: null,
      procedureDate: null,
      indication: null,
      surgeon: null,
      facility: null,
      operatingRoom: null,
      anesthesiaType: null,
      bodySite: null,
      estimatedBloodLoss: null,
      assistants: [],
      steps: [],
      devices: [],
      specimens: [],
      intraoperativeFindings: [],
      complications: [],
      postOpInstructions: [],
      followUp: [],
      outcome: { status: "successful", original: "successful" },
      confidence: 90,
      generatedAt: new Date().toISOString()
    };
    const tags = deriveTags("surgery_report", extraction);
    expect(tags.some((t) => t.label === "Surgery")).toBe(true);
    const outcomeTag = tags.find((t) => t.label === "successful");
    expect(outcomeTag?.tone).toBe("green");
  });

  it("tags billing with a claim status filter shortcut", () => {
    const extraction: MedicalExtraction = {
      kind: "billing",
      recordType: null,
      provider: null,
      date: null,
      serviceDescription: null,
      codes: [],
      amountCharged: null,
      amountPaid: null,
      payer: null,
      denialReason: null,
      claimStatus: { status: "denied", original: "denied" },
      confidence: 70,
      generatedAt: new Date().toISOString()
    };
    const tags = deriveTags("insurance_claim", extraction);
    const statusTag = tags.find((t) => t.label === "denied");
    expect(statusTag?.filter).toEqual({ search: "denied" });
    expect(statusTag?.tone).toBe("red");
  });
});
