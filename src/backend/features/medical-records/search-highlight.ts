// Splits text into plain/matched segments around a search term, for rendering a <mark> highlight.
// Pure + framework-free so it's independently testable.
export interface TextSegment {
  text: string;
  match: boolean;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitHighlight(text: string, query: string): TextSegment[] {
  const q = query.trim();
  if (!q) return [{ text, match: false }];
  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  return text
    .split(re)
    .map((part) => ({ text: part, match: part.toLowerCase() === q.toLowerCase() }));
}
