// Pure date-math helpers backing the custom DatePicker calendar grid. No DOM, no timezone
// surprises: every function works in the browser's local time and NEVER routes through
// `toISOString()`/`new Date(isoString)` for date-only values, since those parse as UTC and can
// shift a date by one day near midnight for users behind UTC (e.g. all of India, UTC+5:30).

/** Local-time "YYYY-MM-DD", safe for any local Date regardless of timezone offset. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a "YYYY-MM-DD" string into a local-midnight Date, or null if malformed/empty. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  // Reject values that don't round-trip (e.g. "2026-02-30" rolls over to March 2nd in native Date).
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBeforeDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() < b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() &&
      (a.getMonth() < b.getMonth() || (a.getMonth() === b.getMonth() && a.getDate() < b.getDate())))
  );
}

export function isAfterDay(a: Date, b: Date): boolean {
  return isBeforeDay(b, a);
}

/** Returns a new Date with `delta` months added, clamping day-of-month so e.g. Jan 31 + 1 month
 *  lands on the last day of February rather than rolling into March. */
export function addMonths(date: Date, delta: number): Date {
  const day = date.getDate();
  const anchored = new Date(date.getFullYear(), date.getMonth() + delta, 1);
  const daysInTarget = new Date(anchored.getFullYear(), anchored.getMonth() + 1, 0).getDate();
  anchored.setDate(Math.min(day, daysInTarget));
  return anchored;
}

/**
 * A 42-cell (6 week x 7 day) grid of local-midnight Dates covering every full week that touches
 * the given month, so the calendar always renders complete weeks including leading/trailing days
 * from the adjacent months.
 */
export function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}
