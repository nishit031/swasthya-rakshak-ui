import { describe, it, expect } from "vitest";
import { splitHighlight } from "../search-highlight";

describe("splitHighlight", () => {
  it("returns the whole text unmatched when the query is empty", () => {
    expect(splitHighlight("Discharge Summary", "")).toEqual([
      { text: "Discharge Summary", match: false }
    ]);
  });

  it("marks a case-insensitive substring match", () => {
    const segments = splitHighlight("MRI Brain Report", "brain");
    expect(segments.map((s) => s.match)).toEqual([false, true, false]);
    expect(segments.find((s) => s.match)?.text.toLowerCase()).toBe("brain");
  });

  it("escapes regex special characters in the query", () => {
    expect(() => splitHighlight("Cost: $1,200 (approx.)", "$1,200 (approx.)")).not.toThrow();
    const segments = splitHighlight("Cost: $1,200 (approx.)", "$1,200 (approx.)");
    expect(segments.some((s) => s.match)).toBe(true);
  });

  it("has no matches when the query isn't present", () => {
    const segments = splitHighlight("Prescription", "xyz");
    expect(segments.every((s) => !s.match)).toBe(true);
  });
});
