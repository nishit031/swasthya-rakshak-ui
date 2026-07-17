import { describe, it, expect } from "vitest";
import { buildImmunizationPdf, type ImmunizationPdfLabels } from "../immunization-pdf";
import { validateVaccines } from "../immunization/immunization.schema";

const labels: ImmunizationPdfLabels = {
  documentTypeLabel: "Vaccination Record",
  facilityLabel: "Facility",
  recordDateLabel: "Date",
  generatedLabel: "Generated",
  summaryHeading: "Summary",
  vaccinesHeading: "Vaccines",
  disclaimer: "AI-generated summary, not a medical diagnosis.",
  footer: "AI-generated summary. Please consult your healthcare provider.",
  columns: {
    vaccine: "Vaccine",
    doseNumber: "Dose",
    date: "Date",
    manufacturer: "Manufacturer",
    lotNumber: "Lot",
    provider: "Provider",
    nextDue: "Next due"
  }
};

const extraction = validateVaccines(
  {
    vaccines: [
      { name: "Tdap", doseNumber: 1, date: "2026-01-10", manufacturer: "Serum Institute" },
      { name: "COVID-19", doseNumber: 2, date: "2026-03-01" }
    ]
  },
  "immunization record text"
);

const record = {
  title: "Vaccine card — City Clinic",
  documentType: "vaccination_record",
  sourceName: "City Clinic",
  visitDate: "2026-07-10"
};

describe("buildImmunizationPdf", () => {
  it("produces a valid non-empty PDF with the vaccine table", async () => {
    const doc = await buildImmunizationPdf(
      record,
      extraction,
      "## Overview\n\nTwo vaccines.",
      labels
    );
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(bytes.slice(0, 4))).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("handles a null summary and empty extraction without throwing", async () => {
    const empty = validateVaccines({}, "x");
    const doc = await buildImmunizationPdf(record, empty, null, labels);
    expect((doc.output("arraybuffer") as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });
});
