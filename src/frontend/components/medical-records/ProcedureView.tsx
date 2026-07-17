"use client";

import {
  FileText,
  RefreshCw,
  Scissors,
  Stethoscope,
  Building2,
  CircleCheck,
  Cpu,
  FlaskConical,
  ClipboardList,
  TriangleAlert,
  HeartPulse,
  SearchX
} from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { ConfidenceBadge } from "@/frontend/components/lab-reports/ConfidenceBadge";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import { outcomeTone } from "@/backend/features/medical-records/procedure/procedure.schema";

export function ProcedureView({
  record,
  busy,
  onRegenerate,
  onDownloadPdf
}: {
  record: MedicalRecord;
  busy?: boolean;
  onRegenerate: () => void;
  onDownloadPdf: () => void;
}) {
  const { t } = useTranslation();
  const e = record.extractedDataJson?.kind === "procedure" ? record.extractedDataJson : null;
  if (!e) return null;

  const hasContent =
    e.procedureName ||
    e.steps.length ||
    e.intraoperativeFindings.length ||
    e.devices.length ||
    e.specimens.length ||
    e.outcome.original ||
    e.postOpInstructions.length ||
    e.followUp.length;

  if (!hasContent) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("medicalRecordsAi.emptyProcTitle")}
        description={t("medicalRecordsAi.emptyProcDesc")}
        action={
          <Button onClick={onRegenerate} disabled={busy}>
            <RefreshCw size={16} />
            {busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
          </Button>
        }
      />
    );
  }

  const overview: { label: string; value: string | null }[] = [
    { label: t("medicalRecordsAi.procCategory"), value: e.procedureCategory },
    { label: t("medicalRecordsAi.procIndication"), value: e.indication },
    { label: t("medicalRecordsAi.procAssistants"), value: e.assistants.join(", ") || null },
    { label: t("medicalRecordsAi.procOperatingRoom"), value: e.operatingRoom },
    { label: t("medicalRecordsAi.procAnesthesia"), value: e.anesthesiaType },
    { label: t("medicalRecordsAi.procBodySite"), value: e.bodySite },
    { label: t("medicalRecordsAi.procBloodLoss"), value: e.estimatedBloodLoss }
  ].filter((d) => d.value);

  return (
    <div className="flex flex-col gap-4">
      {/* At-a-glance summary card */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-secondary-200 bg-secondary-50/50 p-4 dark:border-secondary-900/50 dark:bg-secondary-900/20 sm:grid-cols-4">
        <Stat
          icon={Scissors}
          label={t("medicalRecordsAi.procName")}
          value={e.procedureName ?? "—"}
        />
        <Stat
          icon={Stethoscope}
          label={t("medicalRecordsAi.procSurgeon")}
          value={e.surgeon ?? "—"}
        />
        <Stat
          icon={Building2}
          label={t("medicalRecordsAi.fieldFacility")}
          value={e.facility ?? record.sourceName ?? "—"}
        />
        <div className="flex flex-col items-start gap-1">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            <CircleCheck size={12} />
            {t("medicalRecordsAi.procOutcome")}
          </p>
          {e.outcome.original ? (
            <Badge tone={outcomeTone(e.outcome.status)}>
              {e.outcome.status === "unknown"
                ? e.outcome.original
                : t(`procedureOutcome.${e.outcome.status}`)}
            </Badge>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </div>
        {e.procedureCategory && (
          <div className="col-span-2 sm:col-span-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("medicalRecordsAi.procCategory")}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{e.procedureCategory}</p>
          </div>
        )}
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t("medicalRecordsAi.extractionQuality")}
          </span>
          <ConfidenceBadge score={e.confidence} />
        </div>
      </div>

      {/* Procedure overview */}
      {overview.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30">
          <SectionLabel icon={ClipboardList} label={t("medicalRecordsAi.procOverview")} />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {overview.map((d) => (
              <div key={d.label} className="flex gap-2 text-sm">
                <dt className="w-28 shrink-0 text-gray-500 dark:text-gray-400">{d.label}</dt>
                <dd className="text-gray-800 dark:text-gray-200">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Procedure timeline — visual vertical steps */}
      {e.steps.length > 0 && (
        <div>
          <SectionLabel icon={ClipboardList} label={t("medicalRecordsAi.procTimeline")} />
          <ol className="relative flex flex-col gap-4 pl-1">
            {e.steps.map((step, i) => (
              <li key={i} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {i < e.steps.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-primary-200 dark:bg-primary-900/60" />
                  )}
                </div>
                <p className="pb-1 pt-0.5 text-sm text-gray-700 dark:text-gray-200">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Devices */}
      {e.devices.length > 0 && (
        <div>
          <SectionLabel icon={Cpu} label={t("medicalRecordsAi.procDevices")} />
          <SimpleTable
            headers={[
              t("medicalRecordsAi.colDevice"),
              t("medicalRecordsAi.colManufacturer"),
              t("medicalRecordsAi.colModel"),
              t("medicalRecordsAi.colLocation")
            ]}
            rows={e.devices.map((d) => [d.device, d.manufacturer, d.model, d.location])}
          />
        </div>
      )}

      {/* Specimens */}
      {e.specimens.length > 0 && (
        <div>
          <SectionLabel icon={FlaskConical} label={t("medicalRecordsAi.procSpecimens")} />
          <SimpleTable
            headers={[
              t("medicalRecordsAi.colSpecimen"),
              t("medicalRecordsAi.colCollectionSite"),
              t("medicalRecordsAi.colPurpose")
            ]}
            rows={e.specimens.map((s) => [s.specimen, s.collectionSite, s.purpose])}
          />
        </div>
      )}

      {/* Intraoperative findings */}
      {e.intraoperativeFindings.length > 0 && (
        <InfoCard
          tone="primary"
          icon={Stethoscope}
          title={t("medicalRecordsAi.procFindings")}
          lines={e.intraoperativeFindings}
        />
      )}

      {/* Complications */}
      {e.complications.length > 0 && (
        <InfoCard
          tone="amber"
          icon={TriangleAlert}
          title={t("medicalRecordsAi.procComplications")}
          lines={e.complications}
        />
      )}

      {/* Recovery */}
      {(e.postOpInstructions.length > 0 || e.followUp.length > 0) && (
        <InfoCard
          tone="green"
          icon={HeartPulse}
          title={t("medicalRecordsAi.procRecovery")}
          lines={[...e.postOpInstructions, ...e.followUp]}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FileText size={16} />
          {t("medicalRecordsAi.toolbarDownloadPdf")}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RefreshCw size={16} />
          {busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
        </button>
      </div>

      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {t("medicalRecordsAi.disclaimer")}
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Scissors;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <Icon size={12} />
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: typeof Scissors; label: string }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      <Icon size={14} />
      {label}
    </p>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | null)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 align-top dark:border-gray-800/60">
              {r.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2.5 ${j === 0 ? "font-medium text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CARD_TONE = {
  primary: {
    box: "border-primary-200 bg-primary-50/50 dark:border-primary-900/50 dark:bg-primary-900/15",
    title: "text-primary-700 dark:text-primary-300"
  },
  amber: {
    box: "border-warning-200 bg-warning-50/50 dark:border-warning-900/50 dark:bg-warning-900/15",
    title: "text-warning-700 dark:text-warning-300"
  },
  green: {
    box: "border-success-200 bg-success-50/50 dark:border-success-900/50 dark:bg-success-900/15",
    title: "text-success-700 dark:text-success-300"
  }
} as const;

function InfoCard({
  tone,
  icon: Icon,
  title,
  lines
}: {
  tone: keyof typeof CARD_TONE;
  icon: typeof Scissors;
  title: string;
  lines: string[];
}) {
  const cls = CARD_TONE[tone];
  return (
    <div className={`rounded-xl border p-4 ${cls.box}`}>
      <p
        className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${cls.title}`}
      >
        <Icon size={14} />
        {title}
      </p>
      <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-200">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
