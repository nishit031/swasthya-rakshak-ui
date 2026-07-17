import { describe, it, expect } from "vitest";
import { buildBillingPdf, type BillingPdfLabels } from "../billing-pdf";
import { validateBilling } from "../billing/billing.schema";

const labels: BillingPdfLabels = {
  documentTypeLabel: "Insurance Claim",
  recordDateLabel: "Date",
  generatedLabel: "Generated",
  summaryHeading: "Summary",
  detailsHeading: "Billing details",
  codesHeading: "Billing codes",
  disclaimer: "AI-generated summary, not a medical diagnosis.",
  footer: "AI-generated summary. Please consult your healthcare provider.",
  detailLabels: {
    recordType: "Record type",
    provider: "Provider",
    service: "Service",
    charged: "Charged",
    paid: "Paid",
    payer: "Payer",
    status: "Status",
    denialReason: "Denial reason"
  },
  codeColumns: { code: "Code", system: "System", description: "Description" },
  statusLabels: {
    paid: "Paid",
    denied: "Denied",
    pending: "Pending",
    partial: "Partial",
    submitted: "Submitted",
    unknown: "Unknown"
  }
};

const extraction = validateBilling(
  {
    recordType: "explanation of benefits",
    provider: "City Hospital",
    serviceDescription: "MRI brain",
    codes: [{ code: "70551", system: "CPT", description: "MRI brain" }],
    amountCharged: "₹12,000",
    amountPaid: "₹9,000",
    payer: "Star Health",
    claimStatus: "partially paid"
  },
  "eob text"
);

const record = {
  title: "EOB — Star Health",
  documentType: "insurance_claim",
  visitDate: "2026-07-10"
};

describe("buildBillingPdf", () => {
  it("produces a valid non-empty PDF with details + codes table", async () => {
    const doc = await buildBillingPdf(record, extraction, "## Overview\n\nPartially paid.", labels);
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(bytes.slice(0, 4))).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("handles a null summary and empty extraction without throwing", async () => {
    const empty = validateBilling({}, "x");
    const doc = await buildBillingPdf(record, empty, null, labels);
    expect((doc.output("arraybuffer") as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });
});
