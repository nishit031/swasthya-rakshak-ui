// The imaging-document factory: maps a documentType to its modality label + prompt hints. All four
// radiology types share ONE processor/prompt/schema/renderer (imaging.*), configured only by the
// entry here — adding an imaging modality is a single entry, no new code paths.
//
// Client+server safe (plain data). Keyed by document-types.ts registry keys.

export interface ImagingConfig {
  modality: string; // display label: X-Ray, MRI, CT, Ultrasound
  // Prepended to the extraction prompt to steer type-specific behaviour.
  extractionHint: string;
  // Appended to the summary prompt to steer emphasis.
  summaryFocus: string;
}

const SHARED_FOCUS =
  "what the scan looked at, the key findings in plain language, what is normal, and the radiologist's impression and any recommended follow-up";

export const IMAGING_TYPES: Record<string, ImagingConfig> = {
  xray_report: {
    modality: "X-Ray",
    extractionHint:
      "This is an X-ray (radiograph) report. Typical regions: chest, bone/joint, abdomen. Watch for fractures, effusions, consolidation, and device/line positions.",
    summaryFocus: SHARED_FOCUS
  },
  mri_report: {
    modality: "MRI",
    extractionHint:
      "This is an MRI report — cross-sectional soft-tissue imaging (brain, spine, joints, abdomen). Capture sequences/technique when stated and lesion measurements precisely.",
    summaryFocus: SHARED_FOCUS
  },
  ct_report: {
    modality: "CT",
    extractionHint:
      "This is a CT report — cross-sectional imaging, often with or without contrast. Note the technique (contrast phase) when stated and measure lesions precisely.",
    summaryFocus: SHARED_FOCUS
  },
  ultrasound_report: {
    modality: "Ultrasound",
    extractionHint:
      "This is an ultrasound (sonography) report — e.g. abdomen, pelvis, obstetric, vascular, thyroid. Capture organ-by-organ findings and measurements.",
    summaryFocus: SHARED_FOCUS
  }
};

export function getImagingConfig(documentType?: string | null): ImagingConfig | undefined {
  return documentType ? IMAGING_TYPES[documentType] : undefined;
}

export function isImagingProcessable(documentType?: string | null): boolean {
  return getImagingConfig(documentType) !== undefined;
}

// The modality label for a document type (falls back to null for non-imaging types).
export function modalityFor(documentType?: string | null): string | null {
  return getImagingConfig(documentType)?.modality ?? null;
}
