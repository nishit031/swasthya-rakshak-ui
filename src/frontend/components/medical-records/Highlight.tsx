import { splitHighlight } from "@/backend/features/medical-records/search-highlight";

// Wraps matches of `query` in <mark> — used to show why a record matched the current search.
export function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  return (
    <>
      {splitHighlight(text, query).map((seg, i) =>
        seg.match ? (
          <mark
            key={i}
            className="rounded bg-warning-200 px-0.5 text-inherit dark:bg-warning-500/40"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}
