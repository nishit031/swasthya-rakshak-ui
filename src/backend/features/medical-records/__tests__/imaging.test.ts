import { describe, it, expect } from "vitest";
import {
  IMAGING_TYPES,
  getImagingConfig,
  isImagingProcessable,
  modalityFor
} from "../imaging/imaging.registry";
import {
  validateImaging,
  normalizeMeasurement,
  severityTone,
  hasImagingContent
} from "../imaging/imaging.schema";

const OCR =
  "MRI BRAIN. Indication: headache. Findings: 3 mm nodule in the right frontal lobe. " +
  "No acute intracranial abnormality. Impression: benign-appearing nodule; recommend follow-up MRI in 6 months.";

describe("imaging registry (factory)", () => {
  it("resolves the four imaging types and nothing else", () => {
    for (const k of ["xray_report", "mri_report", "ct_report", "ultrasound_report"]) {
      expect(isImagingProcessable(k)).toBe(true);
    }
    expect(isImagingProcessable("prescription")).toBe(false);
    expect(isImagingProcessable(null)).toBe(false);
    expect(getImagingConfig("nope")).toBeUndefined();
  });

  it("exposes a modality label per type", () => {
    expect(modalityFor("mri_report")).toBe("MRI");
    expect(modalityFor("ct_report")).toBe("CT");
    expect(modalityFor("xray_report")).toBe("X-Ray");
    expect(modalityFor("ultrasound_report")).toBe("Ultrasound");
    expect(modalityFor("prescription")).toBeNull();
    expect(Object.keys(IMAGING_TYPES)).toHaveLength(4);
  });
});

describe("validateImaging", () => {
  it("coerces sections/findings/arrays and never invents", () => {
    const e = validateImaging(
      {
        exam: "MRI Brain",
        regions: ["brain"],
        findings: [
          {
            finding: "pulmonary nodule",
            location: "right frontal lobe",
            severity: "mild",
            measurement: "3 mm",
            explanation: "a small round spot",
            sourceText: "3 mm nodule in the right frontal lobe.",
            bogus: "dropped"
          },
          { finding: "   " } // empty → dropped
        ],
        impression: "benign-appearing nodule\nrecommend follow-up",
        recommendations: ["follow-up MRI in 6 months"],
        normalFindings: ["no acute intracranial abnormality"]
      },
      OCR
    );
    expect(e.kind).toBe("imaging");
    expect(e.exam).toBe("MRI Brain");
    expect(e.findings).toHaveLength(1); // blank finding dropped
    expect(e.findings[0].confidence).toBeGreaterThan(0);
    expect(e.findings[0]).not.toHaveProperty("bogus");
    expect(e.impression).toEqual(["benign-appearing nodule", "recommend follow-up"]); // string → ordered lines
    expect(e.recommendations).toEqual(["follow-up MRI in 6 months"]);
    expect(e.normalFindings).toEqual(["no acute intracranial abnormality"]);
    expect(hasImagingContent(e)).toBe(true);
  });

  it("empty input yields empty arrays and no content", () => {
    const e = validateImaging({}, OCR);
    expect(e.findings).toEqual([]);
    expect(e.impression).toEqual([]);
    expect(hasImagingContent(e)).toBe(false);
  });
});

describe("normalizeMeasurement", () => {
  it("combines value+unit, or pulls from source text, else null", () => {
    expect(normalizeMeasurement("3", "mm", null)).toBe("3 mm");
    expect(normalizeMeasurement(null, null, "a 5.4 x 3.1 cm mass")).toBe("5.4 x 3.1 cm");
    expect(normalizeMeasurement(null, null, "no measurable lesion")).toBeNull();
  });
});

describe("severityTone", () => {
  it("maps severity words to badge tones", () => {
    expect(severityTone("severe")).toBe("red");
    expect(severityTone("mild")).toBe("amber");
    expect(severityTone("no acute")).toBe("green");
    expect(severityTone("normal")).toBe("green");
    expect(severityTone(null)).toBe("gray");
  });
});
