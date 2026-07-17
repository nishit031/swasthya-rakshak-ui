"use client";

import { Bell, FlaskConical, Pill, Sparkles, Users, FileText } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { FeatureCard } from "@/frontend/components/ui/FeatureCard";
import { SectionHeader } from "@/frontend/components/ui/SectionHeader";

export function FeatureSection() {
  const { t } = useTranslation();

  const features = [
    { icon: FileText, tone: "primary" as const, key: "records" },
    { icon: Pill, tone: "success" as const, key: "prescriptions" },
    { icon: FlaskConical, tone: "secondary" as const, key: "labReports" },
    { icon: Bell, tone: "warning" as const, key: "reminders" },
    { icon: Users, tone: "accent" as const, key: "family" },
    { icon: Sparkles, tone: "primary" as const, key: "ai" }
  ];

  return (
    <section id="features" className="bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader centered title={t("features.heading")} subtitle={t("features.subheading")} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard
              key={f.key}
              icon={f.icon}
              tone={f.tone}
              delay={i * 0.08}
              title={t(`features.items.${f.key}.title`)}
              description={t(`features.items.${f.key}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
