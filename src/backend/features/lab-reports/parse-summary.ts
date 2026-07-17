// Parses the LLM lab-report summary Markdown (see LAB_SUMMARY_SYSTEM in ai.service.ts) into
// typed sections so the UI can render cards instead of one wall of text. The summary logic is
// unchanged — this only reads its known "## " section headings on the client.

export interface ParsedSummary {
  overallSummary: string;
  keyFindings: string[];
  abnormalResults: string[];
  normalResults: string[];
  followUp: string;
  hasAbnormal: boolean;
}

type SectionKey = "overall" | "key" | "abnormal" | "normal" | "followup";

// Heading text → section. Order-sensitive: "abnormal" must be tested before "normal"
// because "abnormal results" contains "normal".
function sectionFor(heading: string): SectionKey | null {
  const h = heading.toLowerCase();
  if (h.includes("abnormal")) return "abnormal";
  if (h.includes("key finding")) return "key";
  if (h.includes("normal")) return "normal";
  if (h.includes("follow")) return "followup";
  if (h.includes("summary") || h.includes("overall")) return "overall";
  return null;
}

// A heading is a Markdown "## X" line or a standalone bold "**X**" line.
function headingText(line: string): string | null {
  const hash = line.match(/^#{1,6}\s+(.+?)\s*$/);
  if (hash) return hash[1].replace(/\*/g, "").trim();
  const bold = line.match(/^\*\*(.+?)\*\*:?\s*$/);
  if (bold) return bold[1].trim();
  return null;
}

const isBullet = (line: string) => /^\s*[*-]\s+/.test(line);
const stripBullet = (line: string) =>
  line
    .replace(/^\s*[*-]\s+/, "")
    .replace(/\*\*/g, "")
    .trim();

// "No abnormal results", "None apparent", etc. — placeholder bullets we shouldn't treat as findings.
const isNegation = (s: string) => /\b(no|none|not|nil)\b/i.test(s) && s.length < 60;

export function parseSummary(markdown: string): ParsedSummary {
  const buckets: Record<SectionKey, string[]> = {
    overall: [],
    key: [],
    abnormal: [],
    normal: [],
    followup: []
  };

  let current: SectionKey | null = null;
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = headingText(line);
    if (heading) {
      current = sectionFor(heading);
      continue;
    }
    if (current && line.trim()) buckets[current].push(line);
  }

  const bullets = (lines: string[]) => lines.filter(isBullet).map(stripBullet).filter(Boolean);
  const paragraph = (lines: string[]) =>
    lines
      .filter((l) => !isBullet(l))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  const abnormalResults = bullets(buckets.abnormal).filter((s) => !isNegation(s));

  return {
    overallSummary: paragraph(buckets.overall),
    keyFindings: bullets(buckets.key),
    abnormalResults,
    normalResults: bullets(buckets.normal),
    followUp: paragraph(buckets.followup) || bullets(buckets.followup).join(" "),
    hasAbnormal: abnormalResults.length > 0
  };
}
