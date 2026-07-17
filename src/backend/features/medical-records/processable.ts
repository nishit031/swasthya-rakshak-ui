// Client+server-safe check for "does this document type have an on-demand processor?" — used by
// the card to show the Process action. The actual dispatch (server-only) lives in processing.ts.

import { isClinicalProcessable } from "./clinical/clinical.registry";
import { isMedicationProcessable } from "./medication/medication.registry";
import { isImagingProcessable } from "./imaging/imaging.registry";
import { isProcedureProcessable } from "./procedure/procedure.registry";
import { isImmunizationProcessable } from "./immunization/immunization.registry";
import { isBillingProcessable } from "./billing/billing.registry";

export function isProcessable(documentType?: string | null): boolean {
  return (
    isClinicalProcessable(documentType) ||
    isMedicationProcessable(documentType) ||
    isImagingProcessable(documentType) ||
    isProcedureProcessable(documentType) ||
    isImmunizationProcessable(documentType) ||
    isBillingProcessable(documentType)
  );
}
