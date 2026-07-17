"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Modal } from "@/frontend/components/ui/Modal";
import { Button } from "@/frontend/components/ui/Button";
import { Input, Select } from "@/frontend/components/ui/Field";
import { DatePicker } from "@/frontend/components/ui/DatePicker";
import { apiFetch } from "@/backend/lib/api-client";
import type { LabReport } from "@/backend/features/lab-reports/lab-reports.types";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";

interface EditLabReportModalProps {
  lab: LabReport | null; // null = closed
  onClose: () => void;
  members: FamilyMember[];
  onSaved: () => void;
}

export function EditLabReportModal({ lab, onClose, members, onSaved }: EditLabReportModalProps) {
  const { t } = useTranslation();
  const [testName, setTestName] = useState("");
  const [labName, setLabName] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lab) {
      setTestName(lab.testName || "");
      setLabName(lab.labName || "");
      setReportDate(lab.reportDate ? new Date(lab.reportDate).toISOString().slice(0, 10) : "");
      setFamilyMemberId(lab.familyMemberId || "");
      setError(null);
    }
  }, [lab]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!lab) return;

    setSaving(true);
    setError(null);

    const res = await apiFetch(`/lab-reports/${lab.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        testName: testName || null,
        labName: labName || null,
        reportDate: reportDate || null,
        familyMemberId: familyMemberId || null
      })
    });

    setSaving(false);
    if (!res.success) {
      setError(res.message || "Failed to update");
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <Modal open={lab !== null} onClose={onClose} title={t("labReportsAi.editTitle")}>
      <div className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
            {error}
          </p>
        )}

        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("labReportsAi.fieldTestName")}
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. CBC, Lipid Profile"
            />
            <Input
              label={t("labReportsAi.fieldLabName")}
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g. SRL Diagnostics"
            />
          </div>

          <DatePicker
            label={t("labReportsAi.fieldReportDate")}
            value={reportDate}
            onChange={(v) => setReportDate(v)}
          />

          {members.length > 0 && (
            <Select
              label={t("labReportsAi.forMember")}
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
            >
              <option value="">{t("labReportsAi.self")}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? t("common.loading") : t("common.save")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
