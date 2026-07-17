"use client";

import { useEffect, useState } from "react";
import { Check, Stethoscope, X } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type { PatientSideConnection } from "@/backend/features/connections/connections.types";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

export default function MyDoctorsPage() {
  const { t } = useTranslation();
  const [connections, setConnections] = useState<PatientSideConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function load() {
    const res = await apiFetch<PatientSideConnection[]>("/connections");
    if (res.success) setConnections(res.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function respond(id: string, status: "accepted" | "rejected") {
    setRespondingId(id);
    await apiFetch(`/connections/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setRespondingId(null);
    load();
  }

  const pending = connections.filter((c) => c.status === "pending");
  const accepted = connections.filter((c) => c.status === "accepted");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("nav2.myDoctors")}</h1>
        {!loading && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {accepted.length} {t("patient.myDoctors.connected")} · {pending.length}{" "}
            {t("patient.myDoctors.pending")}
          </p>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && connections.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={Stethoscope}
            title={t("patient.myDoctors.emptyTitle")}
            description={t("patient.myDoctors.emptyDescription")}
          />
        </GlassCard>
      )}

      {!loading && pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t("patient.myDoctors.requestsHeading")}
          </h2>
          {pending.map((c) => (
            <GlassCard key={c.id} className="flex items-center gap-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {c.doctorName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Dr. {c.doctorName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {c.doctorSpecialization ?? c.doctorPhone}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={respondingId === c.id}
                  onClick={() => respond(c.id, "accepted")}
                >
                  <Check size={14} /> {t("patient.myDoctors.accept")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={respondingId === c.id}
                  onClick={() => respond(c.id, "rejected")}
                >
                  <X size={14} /> {t("patient.myDoctors.reject")}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {!loading && accepted.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t("patient.myDoctors.connectedHeading")}
          </h2>
          {accepted.map((c) => (
            <GlassCard key={c.id} className="flex items-center gap-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success-100 text-sm font-bold text-success-700 dark:bg-success-900/40 dark:text-success-300">
                {c.doctorName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Dr. {c.doctorName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {c.doctorSpecialization ?? c.doctorPhone}
                </p>
              </div>
              <Badge tone="green">{t("patient.myDoctors.connectedBadge")}</Badge>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
