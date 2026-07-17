"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardPlus, Clock, Users } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type { AuthUser } from "@/backend/features/auth/auth.types";
import type { DoctorSideConnection } from "@/backend/features/connections/connections.types";
import type { DoctorAuthoredPrescription } from "@/backend/features/prescriptions/prescriptions.types";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { StatCard } from "@/frontend/components/ui/StatCard";
import { GlassCard } from "@/frontend/components/ui/GlassCard";

interface DoctorDashboardData {
  patients: DoctorSideConnection[];
  pendingCount: number;
  prescriptions: DoctorAuthoredPrescription[];
  user: AuthUser | null;
}

export default function DoctorDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<DoctorSideConnection[]>("/connections"),
      apiFetch<DoctorAuthoredPrescription[]>("/doctor/prescriptions"),
      apiFetch<AuthUser>("/auth/me")
    ])
      .then(([connections, prescriptions, userRes]) => {
        const all = connections.data ?? [];
        setData({
          patients: all.filter((c) => c.status === "accepted"),
          pendingCount: all.filter((c) => c.status === "pending").length,
          prescriptions: prescriptions.data ?? [],
          user: userRes.success ? (userRes.data ?? null) : null
        });
      })
      .catch(() => setError(t("common.error")));
  }, [t]);

  const firstName = data?.user?.fullName?.split(" ")[0] ?? "Doctor";

  if (error)
    return (
      <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
        {error}
      </p>
    );
  if (!data)
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("doctor.dashboard.welcome")}, Dr. {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          tone="primary"
          value={data.patients.length}
          label={t("nav2.myPatients")}
          href="/patients"
        />
        <StatCard
          icon={Clock}
          tone="warning"
          value={data.pendingCount}
          label={t("doctor.dashboard.pendingRequests")}
          href="/patients"
        />
        <StatCard
          icon={ClipboardPlus}
          tone="success"
          value={data.prescriptions.length}
          label={t("doctor.dashboard.prescriptionsWritten")}
          href="/doctor-prescriptions"
        />
      </div>

      <GlassCard>
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
          {t("dashboard.quickActions")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/patients"
            className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 transition-transform hover:-translate-y-0.5 dark:bg-primary-900/30 dark:text-primary-300"
          >
            <Users size={16} /> {t("doctor.dashboard.addPatient")}
          </Link>
          <Link
            href="/doctor-prescriptions"
            className="flex items-center gap-2 rounded-lg bg-success-50 px-4 py-2.5 text-sm font-semibold text-success-700 transition-transform hover:-translate-y-0.5 dark:bg-success-900/30 dark:text-success-300"
          >
            <ClipboardPlus size={16} /> {t("doctor.dashboard.newPrescription")}
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
