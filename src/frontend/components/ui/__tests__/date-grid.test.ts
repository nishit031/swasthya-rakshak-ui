import { describe, it, expect } from "vitest";
import {
  addMonths,
  buildMonthGrid,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  parseISODate,
  toISODate
} from "../date-grid";

describe("toISODate / parseISODate", () => {
  it("round-trips a local date without a UTC shift", () => {
    const date = new Date(2026, 0, 1); // Jan 1, 2026 local midnight
    expect(toISODate(date)).toBe("2026-01-01");
    expect(toISODate(parseISODate("2026-01-01")!)).toBe("2026-01-01");
  });

  it("zero-pads single-digit month and day", () => {
    expect(toISODate(new Date(2026, 2, 5))).toBe("2026-03-05");
  });

  it("parses a valid date string into the matching local Date", () => {
    const parsed = parseISODate("2026-07-15");
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(2026);
    expect(parsed!.getMonth()).toBe(6);
    expect(parsed!.getDate()).toBe(15);
  });

  it("returns null for malformed or empty input", () => {
    expect(parseISODate("")).toBeNull();
    expect(parseISODate("not-a-date")).toBeNull();
    expect(parseISODate("2026-1-1")).toBeNull();
  });

  it("rejects a date that doesn't exist (e.g. Feb 30) instead of silently rolling over", () => {
    expect(parseISODate("2026-02-30")).toBeNull();
  });
});

describe("isSameDay / isBeforeDay / isAfterDay", () => {
  it("compares by calendar day, ignoring time-of-day", () => {
    const a = new Date(2026, 5, 10, 23, 59);
    const b = new Date(2026, 5, 10, 0, 1);
    expect(isSameDay(a, b)).toBe(true);
  });

  it("orders across month and year boundaries", () => {
    expect(isBeforeDay(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(true);
    expect(isAfterDay(new Date(2026, 0, 1), new Date(2025, 11, 31))).toBe(true);
    expect(isBeforeDay(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(false);
  });
});

describe("addMonths", () => {
  it("adds and subtracts whole months", () => {
    const base = new Date(2026, 5, 15);
    expect(toISODate(addMonths(base, 1))).toBe("2026-07-15");
    expect(toISODate(addMonths(base, -1))).toBe("2026-05-15");
  });

  it("rolls over the year boundary", () => {
    expect(toISODate(addMonths(new Date(2026, 11, 5), 1))).toBe("2027-01-05");
    expect(toISODate(addMonths(new Date(2026, 0, 5), -1))).toBe("2025-12-05");
  });

  it("clamps to the last day of a shorter target month instead of rolling into the next", () => {
    // Jan 31 + 1 month -> Feb has 28 days in 2026 (not a leap year).
    expect(toISODate(addMonths(new Date(2026, 0, 31), 1))).toBe("2026-02-28");
  });

  it("handles a leap-year February correctly", () => {
    expect(toISODate(addMonths(new Date(2024, 0, 31), 1))).toBe("2024-02-29");
  });
});

describe("buildMonthGrid", () => {
  it("returns exactly 42 cells", () => {
    expect(buildMonthGrid(2026, 6)).toHaveLength(42);
  });

  it("starts the grid on a Sunday and ends on a Saturday", () => {
    const grid = buildMonthGrid(2026, 6);
    expect(grid[0].getDay()).toBe(0);
    expect(grid[41].getDay()).toBe(6);
  });

  it("includes every day of the target month", () => {
    const grid = buildMonthGrid(2026, 6); // July 2026
    const daysInMonth = grid.filter((d) => d.getMonth() === 6 && d.getFullYear() === 2026);
    expect(daysInMonth).toHaveLength(31);
    expect(toISODate(daysInMonth[0])).toBe("2026-07-01");
    expect(toISODate(daysInMonth[30])).toBe("2026-07-31");
  });

  it("includes leading days from the previous month when the 1st isn't a Sunday", () => {
    // March 2026 starts on a Sunday (no leading days); check a month that doesn't.
    const grid = buildMonthGrid(2026, 3); // April 2026 starts on a Wednesday
    const leading = grid.filter((d) => d.getMonth() === 2);
    expect(leading.length).toBeGreaterThan(0);
    expect(leading.every((d) => d.getFullYear() === 2026)).toBe(true);
  });

  it("handles a leap-year February (29 days)", () => {
    const grid = buildMonthGrid(2024, 1);
    const feb = grid.filter((d) => d.getMonth() === 1 && d.getFullYear() === 2024);
    expect(feb).toHaveLength(29);
  });

  it("handles a non-leap-year February (28 days)", () => {
    const grid = buildMonthGrid(2025, 1);
    const feb = grid.filter((d) => d.getMonth() === 1 && d.getFullYear() === 2025);
    expect(feb).toHaveLength(28);
  });
});
