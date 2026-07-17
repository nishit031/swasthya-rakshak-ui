// Shared schema + validation for the clinical-narrative processing base. One uniform section
// model (text or list) covers every clinical note type — the per-type section list lives in
// clinical.registry.ts. Both server (prompts/processor) and client (renderer) import from here,
// so this file stays free of server-only imports.

export interface SectionDef {
  key: string; // JSON key + i18n label key (medicalRecordSections.<key>)
  description: string; // used in the extraction prompt (server-side only)
  type: "text" | "list";
}

// The LLM output, narrowed to the declared sections. A section is either narrative text, a list
// of items, or null when absent (never invented).
export type ClinicalSections = Record<string, string | string[] | null>;

export interface ClinicalExtraction {
  kind: "clinical"; // discriminator — future bases (imaging tables, etc.) use their own kind
  sections: ClinicalSections;
  confidence: number; // 0-100 processing/extraction confidence
  missingSections: string[]; // section keys that came back empty
  generatedAt: string; // ISO timestamp of the processing run
}

const clean = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
};

// Coerce a raw LLM object into the declared section shape: keep only known keys, null anything
// missing/blank, and split list-type sections into a string[]. Never fabricates values — a key
// the model didn't return simply becomes null. Returns the sections plus the empty-key list.
export function validateSections(
  raw: unknown,
  defs: SectionDef[]
): { sections: ClinicalSections; missingSections: string[] } {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sections: ClinicalSections = {};
  const missingSections: string[] = [];

  for (const def of defs) {
    const value = obj[def.key];
    if (def.type === "list") {
      const list = Array.isArray(value)
        ? value.map(clean).filter((s): s is string => s !== null)
        : // Some models return a list section as a single newline/comma-joined string.
          (clean(value)?.split(/\n|;|•/) ?? [])
            .map((s) => s.replace(/^[-*\d.\s]+/, "").trim())
            .filter(Boolean);
      if (list.length === 0) {
        sections[def.key] = null;
        missingSections.push(def.key);
      } else {
        sections[def.key] = list;
      }
    } else {
      const text = clean(value);
      sections[def.key] = text;
      if (text === null) missingSections.push(def.key);
    }
  }

  return { sections, missingSections };
}

// True when at least one section was populated — used to reject an all-empty extraction.
export function hasAnySection(sections: ClinicalSections): boolean {
  return Object.values(sections).some((v) => v !== null && (!Array.isArray(v) || v.length > 0));
}
