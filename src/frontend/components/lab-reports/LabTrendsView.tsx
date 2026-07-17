"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import type { LabReport } from "@/backend/features/lab-reports/lab-reports.types";
import { buildTrendSeries } from "@/backend/features/lab-reports/trends";
import { LabTrendChart } from "./LabTrendChart";

/** Groups every report's extracted values by test name and plots each as a small line chart, so a
 *  user with repeat tests (CBC, Lipid Profile, ...) can see how a value has moved over time. */
export function LabTrendsView({ labs }: { labs: LabReport[] }) {
  const { t, formatMessage } = useTranslation();
  const series = useMemo(() => buildTrendSeries(labs), [labs]);

  if (series.length === 0) {
    return (
      <GlassCard>
        <EmptyState
          icon={TrendingUp}
          title={t("labReportsAi.trendsEmptyTitle")}
          description={t("labReportsAi.trendsEmptyDesc")}
        />
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {series.map((s) => (
        <GlassCard key={s.testName} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{s.testName}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatMessage("labReportsAi.trendsPointCount", { count: s.points.length })}
            </span>
          </div>
          <LabTrendChart series={s} />
        </GlassCard>
      ))}
    </div>
  );
}
