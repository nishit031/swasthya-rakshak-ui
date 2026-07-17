// Pure, timezone-local scheduling helpers shared by reminder generation, the ReminderWatcher
// (deciding what's due now), and the reminders page (showing the next occurrence). A reminder's
// stored `scheduledAt` is treated as an ANCHOR (its first occurrence); recurring occurrences are
// computed on the fly from `repeatType`, so `scheduledAt` never needs to be mutated.

import type { Reminder } from "./reminders.types";

export type RepeatType = string | null | undefined;

// One occurrence key is `${reminderId}::${occurrenceISO}` — a daily reminder gets a fresh key
// per day, so "shown"/"acknowledged" state resets with each new occurrence instead of sticking
// forever after the first time.
export function occurrenceKey(reminderId: string, occurrenceISO: string): string {
  return `${reminderId}::${occurrenceISO}`;
}

// localStorage key for occurrences the ReminderWatcher has already surfaced as a toast, purely
// to avoid re-notifying for the same occurrence on every 30s poll.
const SHOWN_STORAGE_KEY = "sr:shownReminders";

// localStorage key for occurrences the patient has explicitly acted on (tapped "Taken"/"Mark
// done"/"Dismiss"). This is the signal the reminders page uses to bucket a due reminder as
// pending (not yet acknowledged) vs. Upcoming — being *shown* a toast doesn't count as acting on
// it, only clicking a button does.
const ACKNOWLEDGED_STORAGE_KEY = "sr:acknowledgedReminders";

function loadKeySet(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveKeySet(storageKey: string, keys: Set<string>): void {
  localStorage.setItem(storageKey, JSON.stringify([...keys]));
}

export function loadShownKeys(): Set<string> {
  return loadKeySet(SHOWN_STORAGE_KEY);
}

export function saveShownKeys(keys: Set<string>): void {
  saveKeySet(SHOWN_STORAGE_KEY, keys);
}

export function loadAcknowledgedKeys(): Set<string> {
  return loadKeySet(ACKNOWLEDGED_STORAGE_KEY);
}

/** Marks one occurrence as acted on (called from the toast's action buttons). */
export function acknowledgeOccurrence(reminderId: string, occurrenceISO: string): void {
  const keys = loadAcknowledgedKeys();
  keys.add(occurrenceKey(reminderId, occurrenceISO));
  saveKeySet(ACKNOWLEDGED_STORAGE_KEY, keys);
}

function isRecurring(repeatType: RepeatType): boolean {
  return !!repeatType && repeatType !== "none";
}

/** Advance a date by one repeat step, mutating and returning it. */
function addStep(date: Date, repeatType: RepeatType): Date {
  if (repeatType === "weekly") date.setDate(date.getDate() + 7);
  else if (repeatType === "monthly") date.setMonth(date.getMonth() + 1);
  else date.setDate(date.getDate() + 1); // daily (default step)
  return date;
}

/**
 * The most recent occurrence at or before `now` that is on/after the `scheduledAt` anchor and
 * not past `courseEndDate` — i.e. the occurrence that should currently be firing, or `null` if
 * nothing is due right now. Non-recurring reminders resolve to their single `scheduledAt`.
 */
export function currentDueOccurrence(
  scheduledAt: Date,
  repeatType: RepeatType,
  now: Date,
  courseEndDate: Date | null
): Date | null {
  if (now.getTime() < scheduledAt.getTime()) return null;

  const occ = new Date(scheduledAt);
  if (isRecurring(repeatType)) {
    // Walk forward to the latest occurrence that is still <= now.
    for (;;) {
      const next = addStep(new Date(occ), repeatType);
      if (next.getTime() <= now.getTime()) occ.setTime(next.getTime());
      else break;
    }
  }

  if (courseEndDate && occ.getTime() > courseEndDate.getTime()) return null;
  return occ;
}

/**
 * The next occurrence at or after `now` (or the first occurrence, if it hasn't started yet), or
 * `null` if the reminder has no future occurrence (one-time and already past, or course ended).
 * Used for display ("Next: …").
 */
export function nextOccurrence(
  scheduledAt: Date,
  repeatType: RepeatType,
  now: Date,
  courseEndDate: Date | null
): Date | null {
  const occ = new Date(scheduledAt);

  if (now.getTime() > occ.getTime()) {
    if (!isRecurring(repeatType)) return null; // one-time reminder already passed
    while (occ.getTime() < now.getTime()) addStep(occ, repeatType);
  }

  if (courseEndDate && occ.getTime() > courseEndDate.getTime()) return null;
  return occ;
}

/** The three buckets the reminders page groups reminders into. Distinct from the persisted
 *  `Reminder.status` ("active" | "done" | "cancelled"): "active" and "upcoming" are both
 *  derived from a `status: "active"` reminder depending on whether it's currently due. */
export type ReminderBucket = "active" | "upcoming" | "completed";

/**
 * Buckets a reminder for the Active | Upcoming | Completed tabs.
 * - `completed`: status is "done" (or "cancelled"). Terminal — never moves back.
 * - `active`: a `status: "active"` reminder whose current occurrence is due now/overdue and
 *   hasn't been acknowledged yet (not in `acknowledged`) — the ones a patient hasn't acted on.
 *   Being shown a toast for it does not count as acknowledging it, only tapping an action button
 *   does. A dismissed-and-snoozed reminder stays in this bucket (it's still due, just retrying).
 * - `upcoming`: a `status: "active"` reminder that isn't currently due yet, or whose due
 *   occurrence was already acknowledged.
 */
export function classifyReminder(
  reminder: Pick<Reminder, "id" | "status" | "scheduledAt" | "repeatType" | "courseEndDate">,
  now: Date,
  acknowledged: Set<string>
): ReminderBucket {
  if (reminder.status !== "active") return "completed";

  const occurrence = currentDueOccurrence(
    new Date(reminder.scheduledAt),
    reminder.repeatType,
    now,
    reminder.courseEndDate ? new Date(reminder.courseEndDate) : null
  );
  if (!occurrence) return "upcoming";

  return acknowledged.has(occurrenceKey(reminder.id, occurrence.toISOString()))
    ? "upcoming"
    : "active";
}
