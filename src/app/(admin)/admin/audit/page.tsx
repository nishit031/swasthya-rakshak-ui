"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import type { AuditLogRow } from "@/backend/features/admin/admin.types";

export default function AdminAuditPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AuditLogRow[]>("/admin/audit-log").then((res) => {
      if (res.success) setRows(res.data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading)
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("admin.nav.audit")}</h1>

      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 dark:text-gray-400">
              <th className="pb-2">{t("admin.audit.when")}</th>
              <th className="pb-2">{t("admin.audit.action")}</th>
              <th className="pb-2">{t("admin.audit.actor")}</th>
              <th className="pb-2">{t("admin.audit.subject")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="py-2 font-medium text-gray-900 dark:text-white">{row.action}</td>
                <td className="py-2 text-xs text-gray-500 dark:text-gray-400">
                  {row.actorId ?? "—"}
                </td>
                <td className="py-2 text-xs text-gray-500 dark:text-gray-400">{row.userId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
