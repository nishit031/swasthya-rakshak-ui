import { describe, it, expect } from "vitest";
import {
  PROCEDURE_TYPES,
  getProcedureConfig,
  isProcedureProcessable
} from "../procedure/procedure.registry";
import {
  validateProcedure,
  normalizeOutcome,
  outcomeTone,
  hasProcedureContent
} from "../procedure/procedure.schema";

const OCR =
  "OPERATIVE REPORT. Procedure: Laparoscopic appendectomy. Surgeon: Dr. Rao. Anesthesia: general. " +
  "Findings: acutely inflamed appendix. A titanium clip (Medtronic) was applied. Specimen: appendix sent to pathology. " +
  "Estimated blood loss: 20 mL. Outcome: successful, no complications. Follow-up in 2 weeks.";

describe("procedure registry (factory)", () => {
  it("resolves the two procedure types and nothing else", () => {
    expect(isProcedureProcessable("procedure_note")).toBe(true);
    expect(isProcedureProcessable("surgery_report")).toBe(true);
    expect(isProcedureProcessable("mri_report")).toBe(false);
    expect(isProcedureProcessable(null)).toBe(false);
    expect(getProcedureConfig("nope")).toBeUndefined();
    expect(Object.keys(PROCEDURE_TYPES)).toHaveLength(2);
  });
});

describe("normalizeOutcome", () => {
  it("maps phrases to the enum while preserving the original", () => {
    expect(normalizeOutcome("Successful, uneventful")).toEqual({
      status: "successful",
      original: "Successful, uneventful"
    });
    expect(normalizeOutcome("converted to open procedure").status).toBe("converted");
    expect(normalizeOutcome("aborted due to instability").status).toBe("aborted");
    expect(normalizeOutcome("partially completed").status).toBe("partial");
    expect(normalizeOutcome("procedure completed").status).toBe("completed");
    expect(normalizeOutcome("something odd").status).toBe("unknown");
    expect(normalizeOutcome(null)).toEqual({ status: "unknown", original: null });
  });
});

describe("outcomeTone", () => {
  it("maps outcome statuses to badge tones", () => {
    expect(outcomeTone("successful")).toBe("green");
    expect(outcomeTone("completed")).toBe("green");
    expect(outcomeTone("partial")).toBe("amber");
    expect(outcomeTone("aborted")).toBe("red");
    expect(outcomeTone("converted")).toBe("red");
    expect(outcomeTone("unknown")).toBe("gray");
  });
});

describe("validateProcedure", () => {
  it("coerces fields/arrays/objects, normalizes outcome, and never invents", () => {
    const e = validateProcedure(
      {
        procedureName: "Laparoscopic appendectomy",
        surgeon: "Dr. Rao",
        anesthesiaType: "general",
        steps: "Insufflation\nAppendix mobilized\nAppendix removed",
        devices: [
          {
            device: "Titanium clip",
            manufacturer: "Medtronic",
            model: null,
            location: "appendiceal base"
          },
          { device: "   " } // dropped (no device name)
        ],
        specimens: [{ specimen: "Appendix", collectionSite: "RLQ", purpose: "pathology" }],
        intraoperativeFindings: ["Acutely inflamed appendix"],
        complications: [],
        outcome: "successful, no complications",
        followUp: ["Return in 2 weeks"],
        bogus: "ignored"
      },
      OCR
    );
    expect(e.kind).toBe("procedure");
    expect(e.procedureName).toBe("Laparoscopic appendectomy");
    expect(e.steps).toEqual(["Insufflation", "Appendix mobilized", "Appendix removed"]);
    expect(e.devices).toHaveLength(1); // blank device dropped
    expect(e.devices[0].manufacturer).toBe("Medtronic");
    expect(e.specimens[0].purpose).toBe("pathology");
    expect(e.outcome.status).toBe("successful");
    expect(e.complications).toEqual([]); // never fabricated
    expect(e.confidence).toBeGreaterThan(0);
    expect(e).not.toHaveProperty("bogus");
    expect(hasProcedureContent(e)).toBe(true);
  });

  it("empty input yields no content", () => {
    const e = validateProcedure({}, OCR);
    expect(e.procedureName).toBeNull();
    expect(e.steps).toEqual([]);
    expect(hasProcedureContent(e)).toBe(false);
  });
});
