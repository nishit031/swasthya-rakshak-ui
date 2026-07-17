import { describe, it, expect } from "vitest";
import {
  parseFilters,
  serializeFilters,
  isEmptyFilters,
  activeFilterCount,
  confidenceRange,
  type MedicalRecordFilters
} from "../filters";

describe("serializeFilters / parseFilters round-trip", () => {
  it("round-trips every filter facet through a query string", () => {
    const filters: MedicalRecordFilters = {
      search: "diabetes",
      familyMemberId: "fam1",
      documentType: ["xray_report", "mri_report"],
      category: ["imaging"],
      physician: "Dr. Rao",
      facility: "Apollo",
      dateFrom: "2026-01-01",
      dateTo: "2026-06-01",
      confidence: "high",
      processed: "processed",
      sortBy: "visitDate"
    };
    const params = serializeFilters(filters);
    expect(parseFilters(params)).toEqual(filters);
  });

  it("omits empty/absent facets from the query string", () => {
    const params = serializeFilters({ search: "x", documentType: [] });
    expect(params.toString()).toBe("search=x");
  });

  it("parses a plain query-param record (e.g. from Next's searchParams) the same way", () => {
    const filters = parseFilters({ category: "imaging,procedure", physician: "Rao" });
    expect(filters.category).toEqual(["imaging", "procedure"]);
    expect(filters.physician).toBe("Rao");
  });

  it("never throws on a malformed/unknown query string", () => {
    expect(() => parseFilters(new URLSearchParams("bogus=1&confidence=nonsense"))).not.toThrow();
    expect(parseFilters(new URLSearchParams("bogus=1")).search).toBeUndefined();
  });
});

describe("isEmptyFilters / activeFilterCount", () => {
  it("treats an all-empty object as empty", () => {
    expect(isEmptyFilters({})).toBe(true);
    expect(isEmptyFilters({ documentType: [] })).toBe(true);
  });

  it("counts facets but excludes search and sortBy", () => {
    expect(activeFilterCount({ search: "x", sortBy: "visitDate" })).toBe(0);
    expect(activeFilterCount({ category: ["imaging"], physician: "Rao" })).toBe(2);
  });
});

describe("confidenceRange", () => {
  it("maps buckets to the agreed High/Review/Low bands", () => {
    expect(confidenceRange("high")).toEqual({ gte: 85 });
    expect(confidenceRange("review")).toEqual({ gte: 60, lt: 85 });
    expect(confidenceRange("low")).toEqual({ lt: 60 });
  });
});
