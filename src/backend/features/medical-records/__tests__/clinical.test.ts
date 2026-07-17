import { describe, it, expect } from "vitest";
import {
  CLINICAL_TYPES,
  getClinicalConfig,
  isClinicalProcessable
} from "../clinical/clinical.registry";
import { validateSections, hasAnySection } from "../clinical/clinical.schema";

describe("clinical registry (factory)", () => {
  it("resolves the three implemented clinical types and nothing else", () => {
    expect(isClinicalProcessable("doctor_note")).toBe(true);
    expect(isClinicalProcessable("consultation_note")).toBe(true);
    expect(isClinicalProcessable("history_physical")).toBe(true);
    // Registered-but-unimplemented / non-clinical types are not processable this phase.
    expect(isClinicalProcessable("mri_report")).toBe(false);
    expect(isClinicalProcessable("prescription")).toBe(false);
    expect(isClinicalProcessable(null)).toBe(false);
    expect(getClinicalConfig("nope")).toBeUndefined();
  });

  it("resolves the Phase 6 clinical extension types (config-only reuse)", () => {
    for (const type of [
      "diagnosis",
      "treatment_plan",
      "discharge_summary",
      "referral_note",
      "clinician_note"
    ]) {
      expect(isClinicalProcessable(type)).toBe(true);
      expect(getClinicalConfig(type)!.sections.length).toBeGreaterThan(0);
      expect(getClinicalConfig(type)!.summaryFocus).toBeTruthy();
    }
  });

  it("every type has unique section keys", () => {
    for (const config of Object.values(CLINICAL_TYPES)) {
      const keys = config.sections.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("validateSections", () => {
  const defs = getClinicalConfig("doctor_note")!.sections;

  it("keeps only known keys, nulls missing ones, and lists the empties", () => {
    const { sections, missingSections } = validateSections(
      { chief_complaint: "Cough for 3 days", bogus_key: "ignored", diagnosis: "  " },
      defs
    );
    expect(sections.chief_complaint).toBe("Cough for 3 days");
    expect("bogus_key" in sections).toBe(false); // unknown key dropped
    expect(sections.diagnosis).toBeNull(); // blank → null
    expect(missingSections).toContain("diagnosis");
    expect(missingSections).toContain("visit_reason"); // absent → null + flagged
  });

  it("coerces a list section from an array and from a delimited string", () => {
    const fromArray = validateSections(
      { medications: ["Amoxicillin 500mg", "  ", "Paracetamol"] },
      defs
    );
    expect(fromArray.sections.medications).toEqual(["Amoxicillin 500mg", "Paracetamol"]);

    const fromString = validateSections({ medications: "- Amoxicillin\n- Paracetamol" }, defs);
    expect(fromString.sections.medications).toEqual(["Amoxicillin", "Paracetamol"]);
  });

  it("never invents values (empty object → all null)", () => {
    const { sections } = validateSections({}, defs);
    expect(Object.values(sections).every((v) => v === null)).toBe(true);
    expect(hasAnySection(sections)).toBe(false);
  });
});
