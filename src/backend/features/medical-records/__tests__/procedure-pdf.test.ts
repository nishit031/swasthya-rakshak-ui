import { describe, it, expect } from "vitest";
import { buildProcedurePdf, type ProcedurePdfLabels } from "../procedure-pdf";
import { validateProcedure } from "../procedure/procedure.schema";

const labels: ProcedurePdfLabels = {
  documentTypeLabel: "Surgery Report",
  facilityLabel: "Facility",
  surgeonLabel: "Surgeon",
  recordDateLabel: "Date",
  generatedLabel: "Generated",
  outcomeLabel: "Outcome",
  summaryHeading: "Summary",
  detailsHeading: "Procedure overview",
  stepsHeading: "Procedure timeline",
  devicesHeading: "Devices",
  specimensHeading: "Specimens",
  findingsHeading: "Findings",
  complicationsHeading: "Complications",
  recoveryHeading: "Recovery",
  disclaimer: "AI-generated summary, not a medical diagnosis.",
  footer: "AI-generated summary. Please consult your healthcare provider.",
  detailLabels: {
    indication: "Indication",
    assistants: "Assistants",
    operatingRoom: "OR",
    anesthesia: "Anesthesia",
    bodySite: "Body site",
    bloodLoss: "Blood loss",
    category: "Category"
  },
  deviceColumns: {
    device: "Device",
    manufacturer: "Manufacturer",
    model: "Model",
    location: "Location"
  },
  specimenColumns: { specimen: "Specimen", site: "Site", purpose: "Purpose" },
  outcomeLabels: {
    successful: "Successful",
    completed: "Completed",
    partial: "Partial",
    aborted: "Aborted",
    converted: "Converted",
    unknown: "Unknown"
  }
};

const extraction = validateProcedure(
  {
    procedureName: "Laparoscopic appendectomy",
    surgeon: "Dr. Rao",
    anesthesiaType: "general",
    steps: ["Insufflation", "Appendix mobilized", "Appendix removed"],
    devices: [{ device: "Titanium clip", manufacturer: "Medtronic", location: "base" }],
    specimens: [{ specimen: "Appendix", collectionSite: "RLQ", purpose: "pathology" }],
    intraoperativeFindings: ["Acutely inflamed appendix"],
    outcome: "successful",
    postOpInstructions: ["Keep wound dry"],
    followUp: ["Return in 2 weeks"]
  },
  "operative report text"
);

const record = {
  title: "Appendectomy — City Hospital",
  documentType: "surgery_report",
  sourceName: "City Hospital",
  visitDate: "2026-07-10"
};

describe("buildProcedurePdf", () => {
  it("produces a valid non-empty PDF with tables + sections", async () => {
    const doc = await buildProcedurePdf(
      record,
      extraction,
      "## Overview\n\nAppendix removed.",
      labels
    );
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(bytes.slice(0, 4))).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("handles a null summary and empty extraction without throwing", async () => {
    const empty = validateProcedure({}, "x");
    const doc = await buildProcedurePdf(record, empty, null, labels);
    expect((doc.output("arraybuffer") as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });
});
