"use client";

import { useEffect, useState } from "react";
import { TrendingUp, UserPlus, Users, Wallet } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { StatCard } from "@/frontend/components/ui/StatCard";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import type { AdminMetrics } from "@/backend/features/admin/admin.types";

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function AdminMetricsPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    apiFetch<AdminMetrics>("/admin/metrics").then((res) => {
      if (res.success) setMetrics(res.data ?? null);
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("admin.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("admin.subtitle")}</p>
      </div>

      {!metrics && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      )}

      {metrics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              tone="primary"
              value={metrics.totalUsers}
              label={t("admin.metrics.totalUsers")}
            />
            <StatCard
              icon={UserPlus}
              tone="success"
              value={metrics.signupsLast30Days}
              label={t("admin.metrics.signups30d")}
            />
            <StatCard
              icon={Wallet}
              tone="accent"
              value={Math.round(metrics.mrrInPaise / 100)}
              suffix=" ₹"
              label={t("admin.metrics.mrr")}
            />
            <StatCard
              icon={TrendingUp}
              tone="secondary"
              value={Object.values(metrics.activeSubscriptionsByPlan).reduce(
                (sum, p) => sum + p.count,
                0
              )}
              label={t("admin.nav.subscriptions")}
            />
          </div>

          <GlassCard>
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              {t("admin.metrics.activeByPlan")}
            </h2>
            <div className="flex flex-col gap-3">
              {Object.entries(metrics.activeSubscriptionsByPlan).map(([plan, row]) => (
                <div
                  key={plan}
                  className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm last:border-0 dark:border-gray-800"
                >
                  <span className="font-medium capitalize text-gray-700 dark:text-gray-200">
                    {plan}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {row.count} · {formatRupees(row.revenueInPaise)}
                  </span>
                </div>
              ))}
              {Object.keys(metrics.activeSubscriptionsByPlan).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
              )}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
