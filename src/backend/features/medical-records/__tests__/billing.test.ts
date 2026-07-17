import { describe, it, expect } from "vitest";
import { BILLING_TYPES, getBillingConfig, isBillingProcessable } from "../billing/billing.registry";
import {
  validateBilling,
  normalizeClaimStatus,
  claimStatusTone,
  hasBillingContent
} from "../billing/billing.schema";

const OCR =
  "EXPLANATION OF BENEFITS. Provider: City Hospital. Service: MRI brain. CPT 70551. " +
  "Amount charged ₹12,000. Amount paid ₹9,000. Payer: Star Health. Claim status: partially paid.";

describe("billing registry (factory)", () => {
  it("resolves the two billing types and nothing else", () => {
    expect(isBillingProcessable("billing_record")).toBe(true);
    expect(isBillingProcessable("insurance_claim")).toBe(true);
    expect(isBillingProcessable("prescription")).toBe(false);
    expect(isBillingProcessable(null)).toBe(false);
    expect(getBillingConfig("nope")).toBeUndefined();
    expect(Object.keys(BILLING_TYPES)).toHaveLength(2);
  });
});

describe("normalizeClaimStatus", () => {
  it("maps phrases to the enum while preserving the original", () => {
    expect(normalizeClaimStatus("Paid in full")).toEqual({
      status: "paid",
      original: "Paid in full"
    });
    expect(normalizeClaimStatus("claim denied").status).toBe("denied");
    expect(normalizeClaimStatus("partially paid").status).toBe("partial");
    expect(normalizeClaimStatus("under review").status).toBe("pending");
    expect(normalizeClaimStatus("filed with insurer").status).toBe("submitted");
    expect(normalizeClaimStatus("something odd").status).toBe("unknown");
    expect(normalizeClaimStatus(null)).toEqual({ status: "unknown", original: null });
  });
  it("prioritizes denial over paid when both words appear", () => {
    expect(normalizeClaimStatus("payment denied").status).toBe("denied");
  });
});

describe("claimStatusTone", () => {
  it("maps statuses to badge tones", () => {
    expect(claimStatusTone("paid")).toBe("green");
    expect(claimStatusTone("denied")).toBe("red");
    expect(claimStatusTone("partial")).toBe("amber");
    expect(claimStatusTone("pending")).toBe("amber");
    expect(claimStatusTone("submitted")).toBe("blue");
    expect(claimStatusTone("unknown")).toBe("gray");
  });
});

describe("validateBilling", () => {
  it("coerces fields + codes, normalizes status, and never invents", () => {
    const e = validateBilling(
      {
        recordType: "explanation of benefits",
        provider: "City Hospital",
        serviceDescription: "MRI brain",
        codes: [
          { code: "70551", system: "CPT", description: "MRI brain without contrast" },
          { system: "CPT" } // dropped (no code, no description)
        ],
        amountCharged: "₹12,000",
        amountPaid: "₹9,000",
        payer: "Star Health",
        claimStatus: "partially paid",
        bogus: "ignored"
      },
      OCR
    );
    expect(e.kind).toBe("billing");
    expect(e.provider).toBe("City Hospital");
    expect(e.codes).toHaveLength(1); // blank code row dropped
    expect(e.codes[0].code).toBe("70551");
    expect(e.amountCharged).toBe("₹12,000");
    expect(e.claimStatus.status).toBe("partial");
    expect(e.claimStatus.original).toBe("partially paid");
    expect(e.confidence).toBeGreaterThan(0);
    expect(e).not.toHaveProperty("bogus");
    expect(hasBillingContent(e)).toBe(true);
  });

  it("empty input yields no content", () => {
    const e = validateBilling({}, OCR);
    expect(e.provider).toBeNull();
    expect(e.codes).toEqual([]);
    expect(hasBillingContent(e)).toBe(false);
  });
});
