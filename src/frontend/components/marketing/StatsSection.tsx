"use client";

import { Bell, FileText, ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { StatCard } from "@/frontend/components/ui/StatCard";
import { SectionHeader } from "@/frontend/components/ui/SectionHeader";

export function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { icon: Users, tone: "primary" as const, value: 5000, suffix: "+", key: "families" },
    { icon: FileText, tone: "secondary" as const, value: 120000, suffix: "+", key: "records" },
    { icon: Bell, tone: "accent" as const, value: 80000, suffix: "+", key: "reminders" },
    { icon: ShieldCheck, tone: "success" as const, value: 99.9, suffix: "%", key: "uptime" }
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader centered title={t("stats.heading")} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard
              key={s.key}
              icon={s.icon}
              tone={s.tone}
              value={s.value}
              suffix={s.suffix}
              animate
              label={t(`stats.items.${s.key}.label`)}
              description={t(`stats.items.${s.key}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
