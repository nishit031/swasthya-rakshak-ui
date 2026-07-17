// Recent Medical Records search terms, persisted client-side (matches the app's `sr:*`
// localStorage convention). Most-recent-first, deduped case-insensitively, capped small.

const KEY = "sr:mrRecentSearches";
const MAX = 6;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): void {
  const t = term.trim();
  if (!t || typeof window === "undefined") return;
  const existing = getRecentSearches().filter((s) => s.toLowerCase() !== t.toLowerCase());
  localStorage.setItem(KEY, JSON.stringify([t, ...existing].slice(0, MAX)));
}

export function clearRecentSearches(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
