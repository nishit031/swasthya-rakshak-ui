// The immunization-document factory: maps a documentType to its extraction hint + summary focus.
// Both immunization types share ONE processor/prompt/schema/renderer (immunization.*), configured
// only by the entry here — adding an immunization-bearing type is a single entry, no new code paths.
//
// Client+server safe (plain data). Keyed by document-types.ts registry keys.

export interface ImmunizationConfig {
  // Prepended to the extraction prompt to steer type-specific behaviour.
  extractionHint: string;
  // Appended to the summary prompt to steer emphasis.
  summaryFocus: string;
}

export const IMMUNIZATION_TYPES: Record<string, ImmunizationConfig> = {
  immunization_record: {
    extractionHint:
      "This is an immunization record, often listing several vaccines over time. Capture each vaccine with its dose number, date given, manufacturer, lot/batch number, and the provider. Each vaccine dose is its own object.",
    summaryFocus:
      "which vaccines have been given and when, how many doses of each, and whether the document names any upcoming or due doses"
  },
  vaccination_record: {
    extractionHint:
      "This is a vaccination record or certificate. Capture each vaccine dose with its date, dose number, manufacturer, lot/batch number, route, and site. Each dose is its own object.",
    summaryFocus:
      "which vaccinations are recorded, the dates and dose numbers, and any next due date the document states"
  }
};

export function getImmunizationConfig(
  documentType?: string | null
): ImmunizationConfig | undefined {
  return documentType ? IMMUNIZATION_TYPES[documentType] : undefined;
}

export function isImmunizationProcessable(documentType?: string | null): boolean {
  return getImmunizationConfig(documentType) !== undefined;
}
