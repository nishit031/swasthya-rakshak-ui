import { describe, it, expect } from "vitest";
import { buildTrendSeries } from "../trends";
import type { LabReport, ExtractedTest } from "../lab-reports.types";

function makeLab(reportDate: string | null, tests: ExtractedTest[], id = "lab-1"): LabReport {
  return {
    id,
    userId: "user-1",
    familyMemberId: null,
    labName: "SRL Diagnostics",
    testName: "CBC",
    reportDate: reportDate ? new Date(reportDate) : null,
    fileUrl: "/uploads/x.pdf",
    status: null,
    summaryText: null,
    extractedDataJson: { tests },
    extractionConfidence: null,
    originalFilename: null,
    fileSizeBytes: null,
    sha256: null,
    createdAt: new Date(reportDate ?? "2026-01-01")
  };
}

describe("buildTrendSeries", () => {
  it("groups the same test name across reports into one series, sorted by date ascending", () => {
    const labs = [
      makeLab("2026-03-01", [{ name: "Hemoglobin", value: "13.5", unit: "g/dL" }], "a"),
      makeLab("2026-01-01", [{ name: "Hemoglobin", value: "12.0", unit: "g/dL" }], "b")
    ];

    const series = buildTrendSeries(labs);

    expect(series).toHaveLength(1);
    expect(series[0].testName).toBe("Hemoglobin");
    expect(series[0].points.map((p) => p.value)).toEqual([12.0, 13.5]);
  });

  it("groups test names case-insensitively but keeps the first-seen display casing", () => {
    const labs = [
      makeLab("2026-01-01", [{ name: "hemoglobin", value: "12.0" }], "a"),
      makeLab("2026-02-01", [{ name: "Hemoglobin", value: "13.0" }], "b")
    ];

    const series = buildTrendSeries(labs);

    expect(series).toHaveLength(1);
    expect(series[0].testName).toBe("hemoglobin");
    expect(series[0].points).toHaveLength(2);
  });

  it("drops series with fewer than two usable points", () => {
    const labs = [makeLab("2026-01-01", [{ name: "Hemoglobin", value: "12.0" }])];

    expect(buildTrendSeries(labs)).toEqual([]);
  });

  it("skips tests with no numeric value or reports with no date", () => {
    const labs = [
      makeLab("2026-01-01", [{ name: "Culture", value: "Positive" }], "a"),
      makeLab(null, [{ name: "Culture", value: "Negative" }], "b")
    ];

    expect(buildTrendSeries(labs)).toEqual([]);
  });

  it("classifies each point's status from its own reference range/flag", () => {
    const labs = [
      makeLab("2026-01-01", [{ name: "Platelets", value: "410", referenceRange: "150-400" }], "a"),
      makeLab("2026-02-01", [{ name: "Platelets", value: "300", referenceRange: "150-400" }], "b")
    ];

    const [series] = buildTrendSeries(labs);

    expect(series.points[0].status).toBe("high"); // 410
    expect(series.points[1].status).toBe("normal"); // 300
  });

  it("sorts series with the most recently tested one first", () => {
    const labs = [
      makeLab("2026-01-01", [{ name: "Hemoglobin", value: "12.0" }], "a"),
      makeLab("2026-02-01", [{ name: "Hemoglobin", value: "13.0" }], "b"),
      makeLab("2026-01-01", [{ name: "Cholesterol", value: "180" }], "c"),
      makeLab("2026-03-01", [{ name: "Cholesterol", value: "190" }], "d")
    ];

    const series = buildTrendSeries(labs);

    expect(series.map((s) => s.testName)).toEqual(["Cholesterol", "Hemoglobin"]);
  });
});
