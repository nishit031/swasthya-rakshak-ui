import { describe, it, expect } from "vitest";
import { parseNumber, parseRange, classify, markerPct, bandPct } from "../lab-values";

describe("parseNumber", () => {
  it("pulls the leading number from a value string", () => {
    expect(parseNumber("15.4")).toBe(15.4);
    expect(parseNumber("410 K/uL")).toBe(410);
    expect(parseNumber("58.0")).toBe(58);
  });
  it("returns null for non-numeric / empty / null", () => {
    expect(parseNumber("Positive")).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });
});

describe("parseRange", () => {
  it("parses two-sided ranges with various dashes/words", () => {
    expect(parseRange("13.5 - 17.5")).toEqual({ low: 13.5, high: 17.5 });
    expect(parseRange("150 – 400")).toEqual({ low: 150, high: 400 });
    expect(parseRange("40 to 70")).toEqual({ low: 40, high: 70 });
  });
  it("parses one-sided ranges", () => {
    expect(parseRange("< 200")).toEqual({ low: null, high: 200 });
    expect(parseRange("<= 5")).toEqual({ low: null, high: 5 });
    expect(parseRange("> 40")).toEqual({ low: 40, high: null });
  });
  it("returns nulls for unparseable / missing", () => {
    expect(parseRange("Negative")).toEqual({ low: null, high: null });
    expect(parseRange(null)).toEqual({ low: null, high: null });
  });
});

describe("classify", () => {
  it("trusts an explicit high/low flag", () => {
    expect(classify(410, { low: 150, high: 400 }, "H")).toBe("high");
    expect(classify(1, { low: 4, high: 11 }, "Low")).toBe("low");
  });
  it("derives from the range when no flag", () => {
    expect(classify(410, { low: 150, high: 400 })).toBe("high");
    expect(classify(100, { low: 150, high: 400 })).toBe("low");
    expect(classify(300, { low: 150, high: 400 })).toBe("normal");
  });
  it("is unknown without a value or any bound", () => {
    expect(classify(null, { low: 150, high: 400 })).toBe("unknown");
    expect(classify(300, { low: null, high: null })).toBe("unknown");
  });
});

describe("markerPct / bandPct", () => {
  it("places an in-range value inside the band and clamps to [0,100]", () => {
    const p = markerPct(300, 150, 400);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(100);
    const b = bandPct(300, 150, 400);
    expect(b.left).toBeGreaterThan(0);
    expect(b.width).toBeGreaterThan(0);
    expect(b.left + b.width).toBeLessThanOrEqual(100);
  });
  it("keeps an out-of-range marker within the axis (padded, visible)", () => {
    const p = markerPct(410, 150, 400); // just above high
    expect(p).toBeGreaterThan(bandPct(410, 150, 400).left + bandPct(410, 150, 400).width - 1);
    expect(p).toBeLessThanOrEqual(100);
  });
});
