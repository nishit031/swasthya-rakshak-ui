"use client";

import { FileText, RefreshCw, Receipt, AlertCircle } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Button } from "@/frontend/components/ui/Button";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Badge } from "@/frontend/components/ui/Badge";
import { ConfidenceBadge } from "@/frontend/components/lab-reports/ConfidenceBadge";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import { claimStatusTone } from "@/backend/features/medical-records/billing/billing.schema";

export function BillingView({
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
  const extraction = record.extractedDataJson;

  if (!extraction || extraction.kind !== "billing") return null;
  const e = extraction;

  const overview: { label: string; value: string | null }[] = [
    { label: t("medicalRecordsAi.billRecordType"), value: e.recordType },
    { label: t("medicalRecordsAi.billProvider"), value: e.provider },
    { label: t("medicalRecordsAi.fieldRecordDate"), value: e.date },
    { label: t("medicalRecordsAi.billService"), value: e.serviceDescription }
  ].filter((d) => d.value);

  const amounts: { label: string; value: string | null }[] = [
    { label: t("medicalRecordsAi.billCharged"), value: e.amountCharged },
    { label: t("medicalRecordsAi.billPaid"), value: e.amountPaid },
    { label: t("medicalRecordsAi.billPayer"), value: e.payer }
  ].filter((d) => d.value);

  const hasAny =
    overview.length > 0 || amounts.length > 0 || e.codes.length > 0 || !!e.claimStatus.original;

  if (!hasAny) {
    return (
      <EmptyState
        icon={Receipt}
        title={t("medicalRecordsAi.emptyBillingTitle")}
        description={t("medicalRecordsAi.emptyBillingDesc")}
        action={
          <Button onClick={onRegenerate} disabled={busy}>
            <RefreshCw size={16} />
            {busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Administrative summary card */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
            <Receipt size={16} className="text-primary-500" />
            {e.recordType ?? e.provider ?? t("medicalRecordsAi.tabBilling")}
          </p>
          <div className="flex items-center gap-2">
            <Badge tone={claimStatusTone(e.claimStatus.status)}>
              {e.claimStatus.original ?? t(`claimStatus.${e.claimStatus.status}`)}
            </Badge>
            <ConfidenceBadge score={e.confidence} showLabel={false} />
          </div>
        </div>
        {overview.length > 0 && (
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {overview.map((d) => (
              <div key={d.label} className="flex gap-2 text-sm">
                <dt className="w-28 shrink-0 text-gray-500 dark:text-gray-400">{d.label}</dt>
                <dd className="text-gray-800 dark:text-gray-200">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Amounts */}
      {amounts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {amounts.map((d) => (
            <div
              key={d.label}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {d.label}
              </span>
              <span className="mt-0.5 block font-semibold tabular-nums text-gray-900 dark:text-white">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Billing codes */}
      {e.codes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-2.5 font-semibold">{t("medicalRecordsAi.colCode")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("medicalRecordsAi.colCodeSystem")}</th>
                <th className="px-3 py-2.5 font-semibold">
                  {t("medicalRecordsAi.colCodeDescription")}
                </th>
              </tr>
            </thead>
            <tbody>
              {e.codes.map((c, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 align-top last:border-0 dark:border-gray-800/60"
                >
                  <td className="px-3 py-2.5 font-medium tabular-nums text-gray-900 dark:text-white">
                    {c.code ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                    {c.system ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                    {c.description ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Denial reason */}
      {e.denialReason && (
        <div className="flex gap-2 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm dark:border-error-900/50 dark:bg-error-900/20">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-error-500" />
          <div>
            <span className="block font-semibold text-error-700 dark:text-error-300">
              {t("medicalRecordsAi.billDenialReason")}
            </span>
            <span className="text-error-700/90 dark:text-error-200/90">{e.denialReason}</span>
          </div>
        </div>
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
