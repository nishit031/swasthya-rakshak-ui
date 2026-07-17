import { describe, it, expect } from "vitest";
import {
  validateMedications,
  normalizeFrequency,
  normalizeDosage,
  dedupeMedications,
  type MedicationItem
} from "../medication/medication.schema";
import { getMedicationConfig, isMedicationProcessable } from "../medication/medication.registry";

const OCR =
  "Sunrise Clinic prescription. Metformin 500 mg one tablet twice daily for 30 days. " +
  "Amoxicillin 500 mg 1 capsule three times daily for 5 days. Take after meals. Dr. Meera Nair.";

function med(partial: Partial<MedicationItem> = {}): MedicationItem {
  return {
    name: "X",
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
    status: "unknown",
    confidence: 0,
    lowConfidenceFields: [],
    ...partial
  };
}

describe("normalizeFrequency", () => {
  it("maps common expressions, preserves original, null when unknown", () => {
    expect(normalizeFrequency("BID").normalized).toBe("twice daily");
    expect(normalizeFrequency("q8h").normalized).toBe("every 8 hours");
    expect(normalizeFrequency("at bedtime").normalized).toBe("at bedtime");
    const weird = normalizeFrequency("whenever the moon is full");
    expect(weird.normalized).toBeNull();
    expect(weird.original).toBe("whenever the moon is full");
  });

  it("maps Indian Rx slot notation (1-0-1 style) by doses per day", () => {
    expect(normalizeFrequency("1-0-1").normalized).toBe("twice daily");
    expect(normalizeFrequency("1-1-1").normalized).toBe("three times daily");
    expect(normalizeFrequency("1-1-1-1").normalized).toBe("four times daily");
    expect(normalizeFrequency("0-0-1").normalized).toBe("at bedtime");
    expect(normalizeFrequency("1-0-0").normalized).toBe("every morning");
    expect(normalizeFrequency("0-1-0").normalized).toBe("once daily");
    expect(normalizeFrequency("Tab 1-0-1 after meals").normalized).toBe("twice daily");
    expect(normalizeFrequency("0-0-0").normalized).toBeNull();
  });
});

describe("normalizeDosage", () => {
  it("normalizes numeric+unit and written counts, null otherwise", () => {
    expect(normalizeDosage("500 mg").normalized).toBe("500 mg");
    expect(normalizeDosage("one tablet").normalized).toBe("1 tablet");
    expect(normalizeDosage("two capsules").normalized).toBe("2 capsules");
    expect(normalizeDosage("as directed").normalized).toBeNull();
    expect(normalizeDosage("as directed").original).toBe("as directed");
  });
});

describe("dedupeMedications", () => {
  it("merges only exact duplicates and keeps different regimens separate", () => {
    const a = med({ name: "Metformin", strength: "500 mg", instructions: "after meals" });
    const dupExact = med({ name: "Metformin", strength: "500 mg", instructions: "after meals" });
    const diffDose = med({ name: "Metformin", strength: "1000 mg", instructions: "after meals" });
    expect(dedupeMedications([a, dupExact]).length).toBe(1);
    expect(dedupeMedications([a, diffDose]).length).toBe(2); // different strength → keep both
  });

  it("never merges items with no name", () => {
    const anon1 = med({ name: null, strength: "500 mg" });
    const anon2 = med({ name: null, strength: "500 mg" });
    expect(dedupeMedications([anon1, anon2]).length).toBe(2);
  });
});

describe("validateMedications", () => {
  it("coerces an array, one object per medication, never invents, drops empties", () => {
    const raw = {
      medications: [
        {
          name: "Metformin",
          strength: "500 mg",
          dose: "one tablet",
          frequency: "twice daily",
          duration: "30 days",
          status: "continuing"
        },
        {
          medication: "Amoxicillin",
          strength: "500 mg",
          frequency: "TID",
          prn: "no",
          status: "completed"
        },
        { name: "", strength: "" } // empty → dropped
      ]
    };
    const out = validateMedications(raw, OCR);
    expect(out.kind).toBe("medication");
    expect(out.medications.length).toBe(2);
    const [m0, m1] = out.medications;
    expect(m0.name).toBe("Metformin");
    expect(m0.dosage.normalized).toBe("1 tablet"); // "one tablet" normalized
    expect(m0.frequency.normalized).toBe("twice daily");
    expect(m0.status).toBe("current"); // "continuing" → current
    expect(m1.name).toBe("Amoxicillin"); // accepts "medication" alias
    expect(m1.status).toBe("completed");
    expect(m1.prn).toBe(false);
    expect(out.confidence).toBeGreaterThan(0);
  });

  it("accepts deterministic-parser rows (the processor's OCR-service fallback shape)", () => {
    // Mirrors medication.processor.ts mapping of ocr-service ExtractedFields when the LLM finds
    // nothing: name + strength-as-value + frequency/route/duration attributes.
    const out = validateMedications(
      [
        { name: "Flagyl", strength: "400 mg", frequency: "1-0-1", route: "po", duration: "4 days" },
        { name: "Pan", strength: "40 mg", frequency: "od", route: null, duration: null }
      ],
      "Rx Tab Flagyl 400 1-0-1 Tab Pan 40 OD",
      0.4
    );
    expect(out.medications.length).toBe(2);
    expect(out.medications[0].frequency.normalized).toBe("twice daily");
    expect(out.medications[1].frequency.normalized).toBe("once daily");
    // Real (low) engine confidence grounds the per-item scores.
    expect(out.medications[0].confidence).toBeLessThan(75);
  });

  it("clamps unknown status and accepts a bare array", () => {
    const out = validateMedications([{ name: "Aspirin", status: "wat" }], OCR);
    expect(out.medications[0].status).toBe("unknown");
  });
});

describe("medication registry (factory)", () => {
  it("resolves the two medication types and nothing else", () => {
    expect(isMedicationProcessable("prescription")).toBe(true);
    expect(isMedicationProcessable("medication_list")).toBe(true);
    expect(isMedicationProcessable("doctor_note")).toBe(false);
    expect(getMedicationConfig("mri_report")).toBeUndefined();
  });
});
