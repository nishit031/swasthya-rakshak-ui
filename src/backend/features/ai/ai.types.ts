export interface AiSummaryInput {
  sourceType: string;
  sourceId: string;
  familyMemberId?: string;
}

export interface AiExtractInput {
  sourceType: string;
  sourceId: string;
  familyMemberId?: string;
}

// Result of the pre-save metadata auto-fill (POST /ai/analyze).
export interface MetadataResult {
  testName: string | null;
  labName: string | null;
  reportDate: string | null;
  documentType: string | null;
  confidence: number; // 0-100 extraction-quality score
  lowConfidenceFields: string[]; // which of testName/labName/reportDate to flag for review
}

// Result of the pre-save document classification for Medical Records (POST /ai/classify).
export interface MedicalRecordClassification {
  documentType: string | null; // a document-types.ts registry key, or null if unrecognized
  title: string | null;
  facility: string | null;
  physician: string | null;
  recordDate: string | null;
  confidence: number; // 0-100 extraction-quality score
  lowConfidenceFields: string[];
}

export interface AiInsight {
  id: string;
  userId: string;
  familyMemberId: string | null;
  sourceType: string;
  sourceId: string | null;
  insightText: string;
  confidenceScore: number | null;
  createdAt: Date;
}
