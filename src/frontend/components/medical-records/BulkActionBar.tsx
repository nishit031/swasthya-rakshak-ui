"use client";

// Bulk operations toolbar (Phase 7A §9): delete, export (download original files), process
// multiple, move to a family member. No "assign tags" — tags are derived, not stored.

import { useState } from "react";
import { Trash2, Download, Sparkles, Users, X } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Button } from "@/frontend/components/ui/Button";
import { Select } from "@/frontend/components/ui/Field";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";

export function BulkActionBar({
  count,
  onClear,
  onDelete,
  onExport,
  onProcess,
  onMove,
  members,
  busy,
  busyLabel
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onExport: () => void;
  onProcess: () => void;
  onMove: (familyMemberId: string | null) => void;
  members: FamilyMember[];
  busy?: boolean;
  busyLabel?: string;
}) {
  const { t, formatMessage } = useTranslation();
  const [moveTo, setMoveTo] = useState("");

  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/30">
      <span className="text-sm font-semibold text-primary-800 dark:text-primary-200">
        {formatMessage("medicalRecordsAi.selectedCount", { count })}
      </span>

      {busy ? (
        <span className="text-sm text-primary-700 dark:text-primary-300">{busyLabel}</span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onProcess}>
            <Sparkles size={14} />
            {t("medicalRecordsAi.bulkProcess")}
          </Button>
          <Button size="sm" variant="secondary" onClick={onExport}>
            <Download size={14} />
            {t("medicalRecordsAi.bulkExport")}
          </Button>
          {members.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-primary-700 dark:text-primary-300" />
              <Select
                value={moveTo}
                onChange={(e) => {
                  const v = e.target.value;
                  setMoveTo(v);
                  if (v) onMove(v === "self" ? null : v);
                }}
                wrapClassName="mb-0"
                className="h-8 py-0 text-sm"
                aria-label={t("medicalRecordsAi.bulkMove")}
              >
                <option value="">{t("medicalRecordsAi.bulkMove")}</option>
                <option value="self">{t("medicalRecordsAi.self")}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <Button size="sm" variant="danger" onClick={onDelete}>
            <Trash2 size={14} />
            {t("common.delete")}
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={onClear}
        aria-label={t("common.cancel")}
        className="ml-auto rounded-md p-1.5 text-primary-600 hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-primary-300 dark:hover:bg-primary-900/50"
      >
        <X size={16} />
      </button>
    </div>
  );
}
