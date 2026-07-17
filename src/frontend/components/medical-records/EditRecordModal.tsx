"use client";

// Record editing (Phase 7A §5) — metadata only: title, physician, facility, record date, document
// type, notes, family member. Never edits OCR text or extractedDataJson. Save / Cancel / Reprocess.

import { useEffect, useState } from "react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Modal } from "@/frontend/components/ui/Modal";
import { Button } from "@/frontend/components/ui/Button";
import { Input, Textarea, Select } from "@/frontend/components/ui/Field";
import { DatePicker } from "@/frontend/components/ui/DatePicker";
import type {
  MedicalRecord,
  UpdateMedicalRecordInput
} from "@/backend/features/medical-records/medical-records.types";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import { MEDICAL_DOC_TYPES } from "@/backend/features/medical-records/document-types";

interface FormState {
  title: string;
  documentType: string;
  sourceName: string;
  physician: string;
  visitDate: string;
  notes: string;
  familyMemberId: string;
}

function toForm(record: MedicalRecord): FormState {
  return {
    title: record.title,
    documentType: record.documentType ?? "",
    sourceName: record.sourceName ?? "",
    physician: record.physician ?? "",
    visitDate: record.visitDate ? new Date(record.visitDate).toISOString().slice(0, 10) : "",
    notes: record.notes ?? "",
    familyMemberId: record.familyMemberId ?? ""
  };
}

export function EditRecordModal({
  record,
  open,
  onClose,
  members,
  onSaved,
  onReprocess
}: {
  record: MedicalRecord | null;
  open: boolean;
  onClose: () => void;
  members: FamilyMember[];
  onSaved: (updated: MedicalRecord) => void;
  onReprocess: (record: MedicalRecord) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) setForm(toForm(record));
    setError(null);
  }, [record]);

  if (!record || !form) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!record || !form) return;
    setSaving(true);
    setError(null);
    const patch: UpdateMedicalRecordInput = {
      title: form.title,
      documentType: form.documentType || undefined,
      sourceName: form.sourceName,
      physician: form.physician,
      visitDate: form.visitDate || null,
      notes: form.notes,
      familyMemberId: form.familyMemberId || null
    };
    const res = await apiFetch<MedicalRecord>(`/medical-records/${record.id}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.message || t("common.error"));
      return;
    }
    onSaved(res.data);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t("medicalRecordsAi.editTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
            {error}
          </p>
        )}

        <Input
          label={t("medicalRecordsAi.fieldTitle")}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <Select
          label={t("medicalRecordsAi.fieldDocumentType")}
          value={form.documentType}
          onChange={(e) => setForm({ ...form, documentType: e.target.value })}
        >
          <option value="">{t("medicalRecordsAi.notClassified")}</option>
          {MEDICAL_DOC_TYPES.map((d) => (
            <option key={d.key} value={d.key}>
              {t(`medicalRecordTypes.${d.key}`)}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("medicalRecordsAi.fieldFacility")}
            value={form.sourceName}
            onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
          />
          <Input
            label={t("medicalRecordsAi.fieldPhysician")}
            value={form.physician}
            onChange={(e) => setForm({ ...form, physician: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker
            label={t("medicalRecordsAi.fieldRecordDate")}
            value={form.visitDate}
            onChange={(v) => setForm({ ...form, visitDate: v })}
            max={new Date().toISOString().slice(0, 10)}
          />
          <Select
            label={t("medicalRecordsAi.forMember")}
            value={form.familyMemberId}
            onChange={(e) => setForm({ ...form, familyMemberId: e.target.value })}
          >
            <option value="">{t("medicalRecordsAi.self")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          label={t("medicalRecordsAi.fieldNotes")}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <div className="mt-2 flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={saving} className="flex-1">
            {saving ? t("medicalRecordsAi.saving") : t("common.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onReprocess(record);
              onClose();
            }}
          >
            {t("medicalRecordsAi.regenerate")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
