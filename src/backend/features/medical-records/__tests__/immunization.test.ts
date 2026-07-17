import { describe, it, expect } from "vitest";
import {
  IMMUNIZATION_TYPES,
  getImmunizationConfig,
  isImmunizationProcessable
} from "../immunization/immunization.registry";
import { validateVaccines } from "../immunization/immunization.schema";

const OCR =
  "IMMUNIZATION RECORD. Tdap dose 1 given 2026-01-10, manufacturer Serum Institute, lot AB123, " +
  "provider Dr. Mehta. COVID-19 (Covishield) dose 2 given 2026-03-01. Next dose due 2027-01-10.";

describe("immunization registry (factory)", () => {
  it("resolves the two immunization types and nothing else", () => {
    expect(isImmunizationProcessable("immunization_record")).toBe(true);
    expect(isImmunizationProcessable("vaccination_record")).toBe(true);
    expect(isImmunizationProcessable("prescription")).toBe(false);
    expect(isImmunizationProcessable(null)).toBe(false);
    expect(getImmunizationConfig("nope")).toBeUndefined();
    expect(Object.keys(IMMUNIZATION_TYPES)).toHaveLength(2);
  });
});

describe("validateVaccines", () => {
  it("coerces rows, parses dose numbers, scores confidence, and never invents", () => {
    const e = validateVaccines(
      {
        vaccines: [
          {
            name: "Tdap",
            dose: "1st dose",
            date: "2026-01-10",
            manufacturer: "Serum Institute",
            lot: "AB123",
            provider: "Dr. Mehta"
          },
          { name: "COVID-19 (Covishield)", doseNumber: 2, date: "2026-03-01" },
          { name: "   " }, // dropped (no name, no date)
          { bogus: "ignored" } // dropped
        ]
      },
      OCR
    );
    expect(e.kind).toBe("immunization");
    expect(e.vaccines).toHaveLength(2);
    expect(e.vaccines[0].doseNumber).toBe(1); // "1st dose" → 1
    expect(e.vaccines[0].lotNumber).toBe("AB123");
    expect(e.vaccines[1].doseNumber).toBe(2);
    expect(e.confidence).toBeGreaterThan(0);
    expect(e.vaccines[0]).not.toHaveProperty("bogus");
  });

  it("accepts a bare array and yields zero vaccines for empty input", () => {
    expect(validateVaccines([], OCR).vaccines).toEqual([]);
    expect(validateVaccines({}, OCR).vaccines).toEqual([]);
    expect(validateVaccines({}, OCR).confidence).toBe(0);
  });
});
