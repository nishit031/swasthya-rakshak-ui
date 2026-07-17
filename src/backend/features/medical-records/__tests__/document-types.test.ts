import { describe, it, expect } from "vitest";
import { MEDICAL_DOC_TYPES, DOC_TYPE_KEYS, getDocType, groupFor } from "../document-types";

describe("document-types registry", () => {
  it("has unique keys", () => {
    expect(new Set(DOC_TYPE_KEYS).size).toBe(MEDICAL_DOC_TYPES.length);
  });

  it("resolves a known key to its type", () => {
    expect(getDocType("prescription")?.group).toBe("medication");
  });

  it("returns undefined for an unknown or missing key", () => {
    expect(getDocType("not_a_type")).toBeUndefined();
    expect(getDocType(null)).toBeUndefined();
    expect(getDocType(undefined)).toBeUndefined();
  });

  it("groupFor falls back to 'other' for unknown keys", () => {
    expect(groupFor("mri_report")).toBe("imaging");
    expect(groupFor("not_a_type")).toBe("other");
    expect(groupFor(null)).toBe("other");
  });
});
