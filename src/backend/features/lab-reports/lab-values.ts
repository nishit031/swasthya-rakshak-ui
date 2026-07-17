// Pure helpers for turning the AI-extracted lab strings (value + reference range) into numbers we
// can plot. Lab text is messy, so parsing is isolated here and unit-tested; the UI stays dumb.

export type Range = { low: number | null; high: number | null };
export type Status = "normal" | "high" | "low" | "unknown";

// Leading number out of a value string: "15.4" -> 15.4, "410 K/uL" -> 410, "Positive" -> null.
export function parseNumber(s: string | null | undefined): number | null {
  if (s == null) return null;
  const m = String(s).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// Reference range: "13.5 - 17.5" | "150 – 400" | "40 to 70" (two-sided);
// "< 200" / "<= 5" (high only); "> 40" / ">= 40" (low only); else { null, null }.
export function parseRange(s: string | null | undefined): Range {
  if (s == null) return { low: null, high: null };
  const str = String(s).trim();
  const two = str.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (two) return { low: Number(two[1]), high: Number(two[2]) };
  const upper = str.match(/^[<≤]=?\s*(-?\d+(?:\.\d+)?)/);
  if (upper) return { low: null, high: Number(upper[1]) };
  const lower = str.match(/^[>≥]=?\s*(-?\d+(?:\.\d+)?)/);
  if (lower) return { low: Number(lower[1]), high: null };
  return { low: null, high: null };
}

// Is a value in/out of range? Trust the report's own flag when it clearly says high/low; otherwise
// derive from the numeric range. "unknown" when we can't tell (no value, or no bound to compare to).
export function classify(value: number | null, range: Range, flag?: string | null): Status {
  const f = (flag ?? "").trim().toLowerCase();
  if (f === "h" || f === "high" || f === "hi") return "high";
  if (f === "l" || f === "low" || f === "lo") return "low";
  if (value == null) return "unknown";
  const { low, high } = range;
  if (high != null && value > high) return "high";
  if (low != null && value < low) return "low";
  if (low != null || high != null) return "normal";
  return "unknown";
}

// 0–100 position of the value marker on an axis padded ~15% beyond the [low, high] band so an
// out-of-range marker stays visible. Requires a two-sided range; clamps to [0, 100].
export function markerPct(value: number, low: number, high: number): number {
  const span = high - low || 1;
  const pad = span * 0.15;
  const min = Math.min(low, value) - pad;
  const max = Math.max(high, value) + pad;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, pct));
}

// Band [low, high] as left%/width% on the same padded axis, for the shaded "normal" region.
export function bandPct(value: number, low: number, high: number): { left: number; width: number } {
  const span = high - low || 1;
  const pad = span * 0.15;
  const min = Math.min(low, value) - pad;
  const max = Math.max(high, value) + pad;
  const axis = max - min || 1;
  const left = ((low - min) / axis) * 100;
  const width = ((high - low) / axis) * 100;
  return { left: Math.max(0, left), width: Math.max(0, Math.min(100, width)) };
}
