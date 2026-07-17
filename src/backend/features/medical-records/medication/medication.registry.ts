// The medication-document factory: maps a documentType to its extraction hint + summary focus.
// Both medication types share ONE processor/prompt/schema/renderer (medication.*), configured only
// by the entry here — adding a medication-bearing type is a single entry, no new code paths.
//
// Client+server safe (plain data). Keyed by document-types.ts registry keys.

export interface MedicationConfig {
  // Prepended to the extraction prompt to steer type-specific behaviour.
  extractionHint: string;
  // Appended to the summary prompt to steer emphasis.
  summaryFocus: string;
}

export const MEDICATION_TYPES: Record<string, MedicationConfig> = {
  prescription: {
    extractionHint:
      "This is a prescription. Capture the prescribing physician, refill information, quantity, PRN (as-needed) status, and start/end dates when present. Each prescribed drug is its own medication object.",
    summaryFocus:
      "which medications are newly prescribed, how each should be taken, and any special instructions (e.g. take after meals, avoid alcohol)"
  },
  medication_list: {
    extractionHint:
      "This is a medication list. Preserve the order of medications. For each, capture its status (current, completed, discontinued, or as-needed) only when the document states or clearly implies it — otherwise leave status unknown.",
    summaryFocus:
      "how many medications are on the list, which are current/continuing, which have been stopped or discontinued, and any special instructions"
  }
};

export function getMedicationConfig(documentType?: string | null): MedicationConfig | undefined {
  return documentType ? MEDICATION_TYPES[documentType] : undefined;
}

export function isMedicationProcessable(documentType?: string | null): boolean {
  return getMedicationConfig(documentType) !== undefined;
}
