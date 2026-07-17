// The billing-document factory: maps a documentType to its extraction hint + summary focus. Both
// administrative types share ONE processor/prompt/schema/renderer (billing.*), configured only by
// the entry here — adding a billing/administrative type is a single entry, no new code paths.
//
// Client+server safe (plain data). Keyed by document-types.ts registry keys.

export interface BillingConfig {
  // Prepended to the extraction prompt to steer type-specific behaviour.
  extractionHint: string;
  // Appended to the summary prompt to steer emphasis.
  summaryFocus: string;
}

export const BILLING_TYPES: Record<string, BillingConfig> = {
  billing_record: {
    extractionHint:
      "This is a medical bill or invoice. Capture the billing provider, service date, what services were billed, any billing/procedure codes (CPT/HCPCS/ICD), the amount charged and amount paid, and any balance status. There may be no insurer/payer.",
    summaryFocus:
      "who issued the bill, what was billed for, the amount charged and amount paid, and any outstanding balance"
  },
  insurance_claim: {
    extractionHint:
      "This is an insurance claim or explanation of benefits (EOB). Capture the payer/insurer, provider, service description, billing codes, amount charged and amount paid/allowed, the claim status (paid, denied, pending, partial, submitted), and any denial reason.",
    summaryFocus:
      "who the payer is, the claim status, what was charged versus paid, and — if the claim was denied — the stated reason"
  }
};

export function getBillingConfig(documentType?: string | null): BillingConfig | undefined {
  return documentType ? BILLING_TYPES[documentType] : undefined;
}

export function isBillingProcessable(documentType?: string | null): boolean {
  return getBillingConfig(documentType) !== undefined;
}
