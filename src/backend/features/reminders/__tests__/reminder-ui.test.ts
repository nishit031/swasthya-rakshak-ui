import { describe, it, expect } from "vitest";
import { getRelative } from "../reminder-ui";

// `now` pinned to a mid-afternoon moment so partial-day rounding bugs surface.
const NOW = new Date("2026-07-06T16:13:00");

describe("getRelative", () => {
  it("labels a past time as Overdue", () => {
    expect(getRelative("2026-07-06T09:10:00", NOW)).toEqual({ label: "Overdue", tone: "red" });
  });

  it("labels a later-today time as Today", () => {
    expect(getRelative("2026-07-06T20:15:00", NOW)).toEqual({ label: "Today", tone: "green" });
  });

  it("labels tomorrow as Tomorrow regardless of time of day", () => {
    expect(getRelative("2026-07-07T09:10:00", NOW)).toEqual({ label: "Tomorrow", tone: "blue" });
    expect(getRelative("2026-07-07T20:15:00", NOW)).toEqual({ label: "Tomorrow", tone: "blue" });
  });

  it("gives the SAME 'In N days' label to two times on the same calendar date", () => {
    // Both are Jul 8 (2 calendar days after Jul 6) — the morning and evening dose must match,
    // not "In 2 days" vs "In 3 days" (the bug this guards against).
    const morning = getRelative("2026-07-08T09:10:00", NOW);
    const evening = getRelative("2026-07-08T20:15:00", NOW);
    expect(morning).toEqual({ label: "In 2 days", tone: "amber" });
    expect(evening).toEqual({ label: "In 2 days", tone: "amber" });
  });

  it("falls back to an absolute date at 7+ days out", () => {
    const rel = getRelative("2026-07-20T09:00:00", NOW);
    expect(rel.tone).toBe("gray");
    expect(rel.label).not.toMatch(/days/);
  });
});
