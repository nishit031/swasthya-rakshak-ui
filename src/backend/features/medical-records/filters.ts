// The single source of truth for the Medical Records list filter shape. Client+server safe (no
// Prisma import) — reused by the URL-state hook (client), the list service's `where`-builder
// (server), and saved views (server, stores this shape as `filterJson`).

export type ConfidenceBucket = "high" | "review" | "low";
export type ProcessedFilter = "processed" | "unprocessed";
export type RecordSortBy = "createdAt" | "visitDate" | "updatedAt";

export interface MedicalRecordFilters {
  search?: string;
  familyMemberId?: string;
  documentType?: string[];
  category?: string[]; // DocGroup values
  physician?: string;
  facility?: string; // sourceName
  dateFrom?: string; // visitDate >= (YYYY-MM-DD)
  dateTo?: string; // visitDate <= (YYYY-MM-DD)
  confidence?: ConfidenceBucket;
  processed?: ProcessedFilter;
  sortBy?: RecordSortBy; // default "createdAt", always most-recent-first
}

// Confidence bands agreed for the app (see ConfidenceBadge.tsx): High >=85, Review 60-84, Low <60.
export function confidenceRange(bucket: ConfidenceBucket): { gte?: number; lt?: number } {
  if (bucket === "high") return { gte: 85 };
  if (bucket === "review") return { gte: 60, lt: 85 };
  return { lt: 60 };
}

const ARRAY_KEYS = ["documentType", "category"] as const;
const STRING_KEYS = [
  "search",
  "familyMemberId",
  "physician",
  "facility",
  "dateFrom",
  "dateTo",
  "confidence",
  "processed",
  "sortBy"
] as const;

// Parses a URLSearchParams (or a plain query-param record) into a MedicalRecordFilters object.
// Unknown/empty values are simply omitted — this never throws on a malformed URL.
export function parseFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): MedicalRecordFilters {
  const get = (key: string): string | null =>
    params instanceof URLSearchParams
      ? params.get(key)
      : ((Array.isArray(params[key]) ? params[key]?.[0] : params[key]) ?? null);

  const filters: MedicalRecordFilters = {};
  for (const key of ARRAY_KEYS) {
    const raw = get(key);
    if (raw) filters[key] = raw.split(",").filter(Boolean);
  }
  for (const key of STRING_KEYS) {
    const raw = get(key);
    if (raw) (filters as Record<string, string>)[key] = raw;
  }
  return filters;
}

// Serializes filters back into a URLSearchParams — the inverse of parseFilters, used to build the
// shareable list-page URL and a saved view's stored query string.
export function serializeFilters(filters: MedicalRecordFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ARRAY_KEYS) {
    const value = filters[key];
    if (value?.length) params.set(key, value.join(","));
  }
  for (const key of STRING_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  return params;
}

export function isEmptyFilters(filters: MedicalRecordFilters): boolean {
  return serializeFilters(filters).toString().length === 0;
}

// Number of active filter facets (excludes free-text search) — used for a "3 filters active" chip.
export function activeFilterCount(filters: MedicalRecordFilters): number {
  let count = 0;
  for (const key of ARRAY_KEYS) if (filters[key]?.length) count++;
  for (const key of STRING_KEYS) {
    if (key === "search" || key === "sortBy") continue;
    if (filters[key]) count++;
  }
  return count;
}
