"use client";

import { fileUrl } from "@/backend/lib/api-url";
import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Building2,
  User2,
  ExternalLink,
  Download,
  Trash2,
  Sparkles,
  ChevronDown,
  Pencil
} from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { ConfidenceBadge } from "@/frontend/components/lab-reports/ConfidenceBadge";
import { StagedLoader } from "@/frontend/components/lab-reports/StagedLoader";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import { groupFor } from "@/backend/features/medical-records/document-types";
import { deriveTags } from "@/backend/features/medical-records/tags";
import { Highlight } from "./Highlight";
import type { MedicalRecordFilters } from "@/backend/features/medical-records/filters";
import { getClinicalConfig } from "@/backend/features/medical-records/clinical/clinical.registry";
import { isMedicationProcessable } from "@/backend/features/medical-records/medication/medication.registry";
import {
  isImagingProcessable,
  modalityFor
} from "@/backend/features/medical-records/imaging/imaging.registry";
import { isProcedureProcessable } from "@/backend/features/medical-records/procedure/procedure.registry";
import { isImmunizationProcessable } from "@/backend/features/medical-records/immunization/immunization.registry";
import { isBillingProcessable } from "@/backend/features/medical-records/billing/billing.registry";
import { isProcessable } from "@/backend/features/medical-records/processable";
import { downloadClinicalPdf } from "@/backend/features/medical-records/clinical-pdf";
import { downloadMedicationPdf } from "@/backend/features/medical-records/medication-pdf";
import { downloadImagingPdf } from "@/backend/features/medical-records/imaging-pdf";
import { downloadProcedurePdf } from "@/backend/features/medical-records/procedure-pdf";
import { downloadImmunizationPdf } from "@/backend/features/medical-records/immunization-pdf";
import { downloadBillingPdf } from "@/backend/features/medical-records/billing-pdf";
import { GROUP_UI } from "./doc-type-ui";
import { ClinicalSummaryView } from "./ClinicalSummaryView";
import { ClinicalSectionsView } from "./ClinicalSectionsView";
import { MedicationsView } from "./MedicationsView";
import { ImagingView } from "./ImagingView";
import { ProcedureView } from "./ProcedureView";
import { ImmunizationView } from "./ImmunizationView";
import { BillingView } from "./BillingView";

// Persist which record workspaces are left expanded (matches the app's `sr:*` localStorage
// convention, mirroring LabReportCard).
const LS_KEY = "sr:mrWorkspaceExpanded";
function readExpandedMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function persistExpanded(id: string, val: boolean) {
  if (typeof window === "undefined") return;
  const map = readExpandedMap();
  if (val) map[id] = true;
  else delete map[id];
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

type View = "summary" | "sections";

// memo: with many records, re-rendering every card on an unrelated state change (e.g. one card's
// busy/expanded state) is wasted work — each card's own props already change only when it should.
function MedicalRecordCardImpl({
  record,
  busy,
  onProcess,
  onDelete,
  onExport,
  onEdit,
  onTagClick,
  selectable,
  selected,
  onToggleSelect,
  searchQuery
}: {
  record: MedicalRecord;
  busy?: boolean;
  // Take the record/id rather than being pre-bound per card, so the page can pass one stable
  // function reference for every card (required for `memo` below to actually skip re-renders).
  onProcess: (record: MedicalRecord) => void;
  onDelete: (record: MedicalRecord) => void;
  onExport: (record: MedicalRecord) => void;
  onEdit?: (record: MedicalRecord) => void;
  onTagClick?: (filter: Partial<MedicalRecordFilters>) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  searchQuery?: string;
}) {
  const { t } = useTranslation();
  const group = groupFor(record.documentType);
  const { icon: Icon, tone, chip } = GROUP_UI[group];
  const tags = deriveTags(record.documentType, record.extractedDataJson);
  const typeLabel = record.documentType
    ? t(`medicalRecordTypes.${record.documentType}`)
    : t("medicalRecordsAi.notClassified");

  const processable = isProcessable(record.documentType);
  const processed = !!record.summaryText || !!record.extractedDataJson;
  const isMedication = record.extractedDataJson?.kind === "medication";
  const isImaging = record.extractedDataJson?.kind === "imaging";
  const isProcedure = record.extractedDataJson?.kind === "procedure";
  const isImmunization = record.extractedDataJson?.kind === "immunization";
  const isBilling = record.extractedDataJson?.kind === "billing";
  const [expanded, setExpanded] = useState(() => !!readExpandedMap()[record.id]);
  const [view, setView] = useState<View>(record.summaryText ? "summary" : "sections");

  // Auto-expand once when processing freshly completes in-session.
  const prevProcessed = useRef(processed);
  useEffect(() => {
    if (!prevProcessed.current && processed) {
      setExpanded(true);
      setView(record.summaryText ? "summary" : "sections");
      persistExpanded(record.id, true);
    }
    prevProcessed.current = processed;
  }, [processed, record.id, record.summaryText]);

  function toggle() {
    setExpanded((e) => {
      const next = !e;
      persistExpanded(record.id, next);
      return next;
    });
  }

  async function downloadPdf() {
    const extraction = record.extractedDataJson;
    if (!extraction) return;

    if (extraction.kind === "medication") {
      await downloadMedicationPdf(record, extraction, record.summaryText, {
        documentTypeLabel: typeLabel,
        facilityLabel: t("medicalRecordsAi.fieldFacility"),
        physicianLabel: t("medicalRecordsAi.fieldPhysician"),
        recordDateLabel: t("medicalRecordsAi.fieldRecordDate"),
        generatedLabel: t("medicalRecordsAi.generatedAt"),
        summaryHeading: t("medicalRecordsAi.summaryHeading"),
        medicationsHeading: t("medicalRecordsAi.tabMedications"),
        instructionsHeading: t("medicalRecordsAi.medInstructions"),
        disclaimer: t("medicalRecordsAi.disclaimer"),
        footer: t("medicalRecordsAi.pdfFooter"),
        columns: {
          medication: t("medicalRecordsAi.colMedication"),
          strength: t("medicalRecordsAi.colStrength"),
          dose: t("medicalRecordsAi.colDose"),
          frequency: t("medicalRecordsAi.colFrequency"),
          duration: t("medicalRecordsAi.colDuration"),
          status: t("medicalRecordsAi.colStatus")
        },
        statusLabels: {
          current: t("medicationStatus.current"),
          completed: t("medicationStatus.completed"),
          discontinued: t("medicationStatus.discontinued"),
          prn: t("medicationStatus.prn"),
          unknown: t("medicationStatus.unknown")
        }
      });
      return;
    }

    if (extraction.kind === "imaging") {
      await downloadImagingPdf(record, extraction, record.summaryText, {
        documentTypeLabel: typeLabel,
        modalityLabel: modalityFor(record.documentType) ?? typeLabel,
        facilityLabel: t("medicalRecordsAi.fieldFacility"),
        radiologistLabel: t("medicalRecordsAi.imgRadiologist"),
        regionsLabel: t("medicalRecordsAi.imgRegions"),
        recordDateLabel: t("medicalRecordsAi.fieldRecordDate"),
        generatedLabel: t("medicalRecordsAi.generatedAt"),
        summaryHeading: t("medicalRecordsAi.summaryHeading"),
        findingsHeading: t("medicalRecordsAi.tabFindings"),
        measurementsHeading: t("medicalRecordsAi.imgMeasurements"),
        impressionHeading: t("medicalRecordsAi.imgImpression"),
        recommendationsHeading: t("medicalRecordsAi.imgRecommendations"),
        normalFindingsHeading: t("medicalRecordsAi.imgNormalFindings"),
        disclaimer: t("medicalRecordsAi.disclaimer"),
        footer: t("medicalRecordsAi.pdfFooter"),
        findingColumns: {
          finding: t("medicalRecordsAi.colFinding"),
          location: t("medicalRecordsAi.colLocation"),
          severity: t("medicalRecordsAi.colSeverity"),
          measurement: t("medicalRecordsAi.colMeasurement")
        },
        measurementColumns: {
          measurement: t("medicalRecordsAi.colMeasurement"),
          location: t("medicalRecordsAi.colLocation"),
          associated: t("medicalRecordsAi.colAssociatedFinding")
        }
      });
      return;
    }

    if (extraction.kind === "procedure") {
      await downloadProcedurePdf(record, extraction, record.summaryText, {
        documentTypeLabel: typeLabel,
        facilityLabel: t("medicalRecordsAi.fieldFacility"),
        surgeonLabel: t("medicalRecordsAi.procSurgeon"),
        recordDateLabel: t("medicalRecordsAi.fieldRecordDate"),
        generatedLabel: t("medicalRecordsAi.generatedAt"),
        outcomeLabel: t("medicalRecordsAi.procOutcome"),
        summaryHeading: t("medicalRecordsAi.summaryHeading"),
        detailsHeading: t("medicalRecordsAi.procOverview"),
        stepsHeading: t("medicalRecordsAi.procTimeline"),
        devicesHeading: t("medicalRecordsAi.procDevices"),
        specimensHeading: t("medicalRecordsAi.procSpecimens"),
        findingsHeading: t("medicalRecordsAi.procFindings"),
        complicationsHeading: t("medicalRecordsAi.procComplications"),
        recoveryHeading: t("medicalRecordsAi.procRecovery"),
        disclaimer: t("medicalRecordsAi.disclaimer"),
        footer: t("medicalRecordsAi.pdfFooter"),
        detailLabels: {
          indication: t("medicalRecordsAi.procIndication"),
          assistants: t("medicalRecordsAi.procAssistants"),
          operatingRoom: t("medicalRecordsAi.procOperatingRoom"),
          anesthesia: t("medicalRecordsAi.procAnesthesia"),
          bodySite: t("medicalRecordsAi.procBodySite"),
          bloodLoss: t("medicalRecordsAi.procBloodLoss"),
          category: t("medicalRecordsAi.procCategory")
        },
        deviceColumns: {
          device: t("medicalRecordsAi.colDevice"),
          manufacturer: t("medicalRecordsAi.colManufacturer"),
          model: t("medicalRecordsAi.colModel"),
          location: t("medicalRecordsAi.colLocation")
        },
        specimenColumns: {
          specimen: t("medicalRecordsAi.colSpecimen"),
          site: t("medicalRecordsAi.colCollectionSite"),
          purpose: t("medicalRecordsAi.colPurpose")
        },
        outcomeLabels: {
          successful: t("procedureOutcome.successful"),
          completed: t("procedureOutcome.completed"),
          partial: t("procedureOutcome.partial"),
          aborted: t("procedureOutcome.aborted"),
          converted: t("procedureOutcome.converted"),
          unknown: t("procedureOutcome.unknown")
        }
      });
      return;
    }

    if (extraction.kind === "immunization") {
      await downloadImmunizationPdf(record, extraction, record.summaryText, {
        documentTypeLabel: typeLabel,
        facilityLabel: t("medicalRecordsAi.fieldFacility"),
        recordDateLabel: t("medicalRecordsAi.fieldRecordDate"),
        generatedLabel: t("medicalRecordsAi.generatedAt"),
        summaryHeading: t("medicalRecordsAi.summaryHeading"),
        vaccinesHeading: t("medicalRecordsAi.tabImmunizations"),
        disclaimer: t("medicalRecordsAi.disclaimer"),
        footer: t("medicalRecordsAi.pdfFooter"),
        columns: {
          vaccine: t("medicalRecordsAi.colVaccine"),
          doseNumber: t("medicalRecordsAi.colDoseNumber"),
          date: t("medicalRecordsAi.colDate"),
          manufacturer: t("medicalRecordsAi.vacManufacturer"),
          lotNumber: t("medicalRecordsAi.vacLotNumber"),
          provider: t("medicalRecordsAi.colProvider"),
          nextDue: t("medicalRecordsAi.colNextDue")
        }
      });
      return;
    }

    if (extraction.kind === "billing") {
      await downloadBillingPdf(record, extraction, record.summaryText, {
        documentTypeLabel: typeLabel,
        recordDateLabel: t("medicalRecordsAi.fieldRecordDate"),
        generatedLabel: t("medicalRecordsAi.generatedAt"),
        summaryHeading: t("medicalRecordsAi.summaryHeading"),
        detailsHeading: t("medicalRecordsAi.billDetails"),
        codesHeading: t("medicalRecordsAi.billCodes"),
        disclaimer: t("medicalRecordsAi.disclaimer"),
        footer: t("medicalRecordsAi.pdfFooter"),
        detailLabels: {
          recordType: t("medicalRecordsAi.billRecordType"),
          provider: t("medicalRecordsAi.billProvider"),
          service: t("medicalRecordsAi.billService"),
          charged: t("medicalRecordsAi.billCharged"),
          paid: t("medicalRecordsAi.billPaid"),
          payer: t("medicalRecordsAi.billPayer"),
          status: t("medicalRecordsAi.billStatus"),
          denialReason: t("medicalRecordsAi.billDenialReason")
        },
        codeColumns: {
          code: t("medicalRecordsAi.colCode"),
          system: t("medicalRecordsAi.colCodeSystem"),
          description: t("medicalRecordsAi.colCodeDescription")
        },
        statusLabels: {
          paid: t("claimStatus.paid"),
          denied: t("claimStatus.denied"),
          pending: t("claimStatus.pending"),
          partial: t("claimStatus.partial"),
          submitted: t("claimStatus.submitted"),
          unknown: t("claimStatus.unknown")
        }
      });
      return;
    }

    const config = getClinicalConfig(record.documentType);
    if (!config) return;
    const sectionLabels: Record<string, string> = {};
    for (const def of config.sections)
      sectionLabels[def.key] = t(`medicalRecordSections.${def.key}`);
    await downloadClinicalPdf(record, config, extraction, record.summaryText, {
      documentTypeLabel: typeLabel,
      facilityLabel: t("medicalRecordsAi.fieldFacility"),
      physicianLabel: t("medicalRecordsAi.fieldPhysician"),
      recordDateLabel: t("medicalRecordsAi.fieldRecordDate"),
      generatedLabel: t("medicalRecordsAi.generatedAt"),
      summaryHeading: t("medicalRecordsAi.summaryHeading"),
      disclaimer: t("medicalRecordsAi.disclaimer"),
      footer: t("medicalRecordsAi.pdfFooter"),
      sectionLabels
    });
  }

  // Stage labels are chosen by document type (extractedDataJson isn't set yet while processing).
  const medicationDoc = isMedicationProcessable(record.documentType);
  const imagingDoc = isImagingProcessable(record.documentType);
  const procedureDoc = isProcedureProcessable(record.documentType);
  const immunizationDoc = isImmunizationProcessable(record.documentType);
  const billingDoc = isBillingProcessable(record.documentType);
  const extractStage = medicationDoc
    ? "stageProcessMedsExtract"
    : imagingDoc
      ? "stageProcessImgExtract"
      : procedureDoc
        ? "stageProcessProcExtract"
        : immunizationDoc
          ? "stageProcessImmExtract"
          : billingDoc
            ? "stageProcessBillExtract"
            : "stageProcessExtract";
  const summaryStage = medicationDoc
    ? "stageProcessMedsSummary"
    : imagingDoc
      ? "stageProcessImgSummary"
      : procedureDoc
        ? "stageProcessProcSummary"
        : immunizationDoc
          ? "stageProcessImmSummary"
          : billingDoc
            ? "stageProcessBillSummary"
            : "stageProcessSummary";
  const processStages = [
    t("medicalRecordsAi.stageProcessReading"),
    t(`medicalRecordsAi.${extractStage}`),
    t(`medicalRecordsAi.${summaryStage}`),
    t("medicalRecordsAi.stageProcessDone")
  ];

  const showWorkspace = processable && processed && !busy;

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {selectable && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(record.id)}
            aria-label={t("medicalRecordsAi.selectRecords")}
            className="mt-3 h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-gray-600"
          />
        )}
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                <Highlight text={record.title} query={searchQuery ?? ""} />
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={tone}>{typeLabel}</Badge>
                {record.extractionConfidence != null && (
                  <ConfidenceBadge score={record.extractionConfidence} showLabel={false} />
                )}
                {record.sourceName && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Building2 size={14} />
                    {record.sourceName}
                  </span>
                )}
                {record.physician && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <User2 size={14} />
                    {record.physician}
                  </span>
                )}
                {record.visitDate && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar size={14} />
                    {new Date(record.visitDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                )}
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => (
                    <button
                      key={`${tag.labelKey ?? tag.label}-${idx}`}
                      type="button"
                      onClick={() => onTagClick?.(tag.filter)}
                      disabled={!onTagClick}
                      className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-default"
                    >
                      <Badge tone={tag.tone}>{tag.labelKey ? t(tag.labelKey) : tag.label}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {processable && !processed && !busy && (
                <Button size="sm" onClick={() => onProcess(record)}>
                  <Sparkles size={16} />
                  {t("medicalRecordsAi.process")}
                </Button>
              )}
              <a
                href={fileUrl(record.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30"
              >
                <ExternalLink size={16} />
                {t("medicalRecordsAi.actViewOriginal")}
              </a>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Pencil size={16} />
                  {t("common.edit")}
                </button>
              )}
              <button
                type="button"
                onClick={() => onExport(record)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Download size={16} />
                {t("medicalRecordsAi.actExport")}
              </button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(record)}
                aria-label={t("common.delete")}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
          {record.notes && (
            <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
              {record.notes}
            </p>
          )}
        </div>
      </div>

      {/* Processing: force-open staged loader */}
      {processable && busy && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <StagedLoader stages={processStages} />
        </div>
      )}

      {/* Workspace: summary + sections available */}
      {showWorkspace && (
        <div className="border-t border-gray-200 pt-2 dark:border-gray-800">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            className="flex w-full items-center justify-between rounded-md py-1.5 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={16} />
              {expanded ? t("medicalRecordsAi.hideWorkspace") : t("medicalRecordsAi.viewWorkspace")}
            </span>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={18} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-4 pt-3">
                  <div className="flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                    <TabButton
                      active={view === "summary"}
                      onClick={() => setView("summary")}
                      label={t("medicalRecordsAi.tabSummary")}
                    />
                    <TabButton
                      active={view === "sections"}
                      onClick={() => setView("sections")}
                      label={
                        isMedication
                          ? t("medicalRecordsAi.tabMedications")
                          : isImaging
                            ? t("medicalRecordsAi.tabFindings")
                            : isProcedure
                              ? t("medicalRecordsAi.tabProcedure")
                              : isImmunization
                                ? t("medicalRecordsAi.tabImmunizations")
                                : isBilling
                                  ? t("medicalRecordsAi.tabBilling")
                                  : t("medicalRecordsAi.tabSections")
                      }
                    />
                  </div>

                  {view === "summary" && record.summaryText ? (
                    <ClinicalSummaryView
                      record={record}
                      summaryText={record.summaryText}
                      busy={busy}
                      onRegenerate={() => onProcess(record)}
                      onDownloadPdf={downloadPdf}
                    />
                  ) : isMedication ? (
                    <MedicationsView
                      record={record}
                      busy={busy}
                      onRegenerate={() => onProcess(record)}
                      onDownloadPdf={downloadPdf}
                    />
                  ) : isImaging ? (
                    <ImagingView
                      record={record}
                      busy={busy}
                      onRegenerate={() => onProcess(record)}
                      onDownloadPdf={downloadPdf}
                    />
                  ) : isProcedure ? (
                    <ProcedureView
                      record={record}
                      busy={busy}
                      onRegenerate={() => onProcess(record)}
                      onDownloadPdf={downloadPdf}
                    />
                  ) : isImmunization ? (
                    <ImmunizationView
                      record={record}
                      busy={busy}
                      onRegenerate={() => onProcess(record)}
                      onDownloadPdf={downloadPdf}
                    />
                  ) : isBilling ? (
                    <BillingView
                      record={record}
                      busy={busy}
                      onRegenerate={() => onProcess(record)}
                      onDownloadPdf={downloadPdf}
                    />
                  ) : (
                    <ClinicalSectionsView
                      record={record}
                      busy={busy}
                      onRegenerate={() => onProcess(record)}
                      onDownloadPdf={downloadPdf}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GlassCard>
  );
}

export const MedicalRecordCard = memo(MedicalRecordCardImpl);

function TabButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-primary-300"
          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      }`}
    >
      {label}
    </button>
  );
}
