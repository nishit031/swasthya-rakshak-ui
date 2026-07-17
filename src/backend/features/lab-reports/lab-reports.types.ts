// Shape of the AI-extracted structured data (from POST /ai/extract), stored in
// LabReport.extractedDataJson. Every field is optional — the LLM output is trusted-but-loose, so
// the UI treats a missing/odd field as "unknown" rather than erroring.
export interface ExtractedTest {
  name?: string;
  value?: string;
  unit?: string | null;
  referenceRange?: string | null;
  flag?: string | null;
}
export interface ExtractedData {
  documentType?: string;
  tests?: ExtractedTest[];
  notes?: string | null;
  raw?: string; // fallback when the LLM output wasn't the expected JSON shape
}

export interface LabReport {
  id: string;
  userId: string;
  familyMemberId: string | null;
  labName: string | null;
  testName: string | null;
  reportDate: Date | null;
  fileUrl: string;
  status: string | null;
  summaryText: string | null;
  extractedDataJson: ExtractedData | null;
  extractionConfidence: number | null;
  originalFilename: string | null;
  fileSizeBytes: number | null;
  sha256: string | null;
  createdAt: Date;
}

// GET /lab-reports/:id/versions — one entry per past POST /ai/extract call (newest first).
export interface LabReportVersionSummary {
  id: string;
  versionNumber: number;
  schemaVersion: string | null;
  extractorVersion: string | null;
  kind: string;
  confidence: number | null;
  createdAt: Date;
}

// GET /lab-reports/:id/versions/:versionNumber — a specific version's full extracted data.
export interface LabReportVersionDetail extends LabReportVersionSummary {
  extractedDataJson: ExtractedData | null;
}

export interface CreateLabReportInput {
  familyMemberId?: string;
  labName?: string;
  testName?: string;
  reportDate?: string;
  fileUrl: string;
  status?: string;
  extractionConfidence?: number;
  // Layer 1 (original-file) metadata, produced by the /upload endpoint.
  originalFilename?: string;
  fileSizeBytes?: number;
  sha256?: string;
}
