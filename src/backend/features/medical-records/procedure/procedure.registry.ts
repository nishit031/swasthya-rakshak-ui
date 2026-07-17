// The procedure-document factory: maps a documentType to its extraction hint + summary focus. Both
// procedural types share ONE processor/prompt/schema/renderer (procedure.*), configured only by the
// entry here — adding a procedural type is a single entry, no new code paths.
//
// Client+server safe (plain data). Keyed by document-types.ts registry keys.

export interface ProcedureConfig {
  // Prepended to the extraction prompt to steer type-specific behaviour.
  extractionHint: string;
  // Appended to the summary prompt to steer emphasis.
  summaryFocus: string;
}

export const PROCEDURE_TYPES: Record<string, ProcedureConfig> = {
  procedure_note: {
    extractionHint:
      "This is a procedure note, often for a minor or in-office procedure. Capture the procedure name, why it was done, the high-level steps, any devices or specimens, the outcome, and after-care instructions. Some operative fields (operating room, anesthesia, blood loss) may be absent.",
    summaryFocus:
      "what procedure was done and why, what was found, the outcome, and the recovery/after-care instructions"
  },
  surgery_report: {
    extractionHint:
      "This is an operative/surgery report. Capture the surgeon and assistants, anesthesia type, operating room, estimated blood loss, implanted devices, specimens collected, intraoperative findings, complications, the outcome, and post-operative instructions.",
    summaryFocus:
      "what surgery was performed and why, the key intraoperative findings, the outcome, any complications, and the recovery/follow-up plan"
  }
};

export function getProcedureConfig(documentType?: string | null): ProcedureConfig | undefined {
  return documentType ? PROCEDURE_TYPES[documentType] : undefined;
}

export function isProcedureProcessable(documentType?: string | null): boolean {
  return getProcedureConfig(documentType) !== undefined;
}
