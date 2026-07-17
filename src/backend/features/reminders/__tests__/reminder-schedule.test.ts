import { describe, it, expect } from "vitest";
import {
  classifyReminder,
  currentDueOccurrence,
  nextOccurrence,
  occurrenceKey
} from "../reminder-schedule";
import type { Reminder } from "../reminders.types";

describe("currentDueOccurrence", () => {
  const scheduledAt = new Date("2026-07-01T20:00:00"); // night dose anchor

  it("returns null before the first occurrence", () => {
    const now = new Date("2026-07-01T18:00:00");
    expect(currentDueOccurrence(scheduledAt, "daily", now, null)).toBeNull();
  });

  it("returns today's occurrence for a daily reminder several days in", () => {
    const now = new Date("2026-07-05T20:30:00");
    const occ = currentDueOccurrence(scheduledAt, "daily", now, null);
    expect(occ).not.toBeNull();
    expect(occ?.toISOString().slice(0, 10)).toBe("2026-07-05");
    expect(occ?.getHours()).toBe(20);
  });

  it("stops once the course end date has passed", () => {
    const courseEnd = new Date("2026-07-05T23:59:59");
    const now = new Date("2026-07-08T20:30:00");
    expect(currentDueOccurrence(scheduledAt, "daily", now, courseEnd)).toBeNull();
  });

  it("a one-time reminder resolves to its single scheduledAt", () => {
    const now = new Date("2026-07-03T09:00:00");
    const occ = currentDueOccurrence(scheduledAt, "none", now, null);
    expect(occ?.toISOString()).toBe(scheduledAt.toISOString());
  });
});

describe("nextOccurrence", () => {
  const scheduledAt = new Date("2026-07-01T09:00:00");

  it("returns the anchor when the reminder has not started", () => {
    const now = new Date("2026-06-30T12:00:00");
    expect(nextOccurrence(scheduledAt, "daily", now, null)?.toISOString()).toBe(
      scheduledAt.toISOString()
    );
  });

  it("returns the upcoming daily occurrence mid-course", () => {
    const now = new Date("2026-07-04T12:00:00"); // past today's 9 AM
    const occ = nextOccurrence(scheduledAt, "daily", now, null);
    expect(occ?.toISOString().slice(0, 10)).toBe("2026-07-05");
    expect(occ?.getHours()).toBe(9);
  });

  it("returns null for a one-time reminder already in the past", () => {
    const now = new Date("2026-07-02T12:00:00");
    expect(nextOccurrence(scheduledAt, "none", now, null)).toBeNull();
  });

  it("returns null once the next occurrence would exceed the course end date", () => {
    const courseEnd = new Date("2026-07-03T23:59:59");
    const now = new Date("2026-07-04T12:00:00");
    expect(nextOccurrence(scheduledAt, "daily", now, courseEnd)).toBeNull();
  });
});

describe("classifyReminder", () => {
  function reminder(
    overrides: Partial<
      Pick<Reminder, "id" | "status" | "scheduledAt" | "repeatType" | "courseEndDate">
    > = {}
  ) {
    return {
      id: "rem-1",
      status: "active",
      scheduledAt: new Date("2026-07-01T09:00:00"),
      repeatType: "daily",
      courseEndDate: null,
      ...overrides
    };
  }

  it("buckets a done reminder as completed regardless of timing", () => {
    const r = reminder({ status: "done" });
    const now = new Date("2026-07-01T09:00:00");
    expect(classifyReminder(r, now, new Set())).toBe("completed");
  });

  it("buckets an active reminder with no due occurrence yet as upcoming", () => {
    const r = reminder({ scheduledAt: new Date("2026-07-05T09:00:00") });
    const now = new Date("2026-07-01T00:00:00"); // before the anchor
    expect(classifyReminder(r, now, new Set())).toBe("upcoming");
  });

  it("buckets a status:active reminder that is due now and not acknowledged as the active bucket", () => {
    const r = reminder();
    const now = new Date("2026-07-05T09:30:00"); // today's occurrence is due
    expect(classifyReminder(r, now, new Set())).toBe("active");
  });

  it("buckets a due occurrence as upcoming once its key is acknowledged", () => {
    const r = reminder();
    const now = new Date("2026-07-05T09:30:00");
    const occurrence = currentDueOccurrence(r.scheduledAt, r.repeatType, now, null)!;
    const acknowledged = new Set([occurrenceKey(r.id, occurrence.toISOString())]);
    expect(classifyReminder(r, now, acknowledged)).toBe("upcoming");
  });

  it("does not let acknowledging a past occurrence carry over to a new day's occurrence", () => {
    const r = reminder();
    const yesterday = new Date("2026-07-04T09:30:00");
    const yesterdayOccurrence = currentDueOccurrence(r.scheduledAt, r.repeatType, yesterday, null)!;
    const acknowledged = new Set([occurrenceKey(r.id, yesterdayOccurrence.toISOString())]);

    const today = new Date("2026-07-05T09:30:00");
    expect(classifyReminder(r, today, acknowledged)).toBe("active");
  });

  it("buckets a reminder past its course end date as upcoming (no current due occurrence)", () => {
    const r = reminder({ courseEndDate: new Date("2026-07-03T23:59:59") });
    const now = new Date("2026-07-05T09:30:00");
    expect(classifyReminder(r, now, new Set())).toBe("upcoming");
  });
});
