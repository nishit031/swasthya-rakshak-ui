"use client";

import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge, type BadgeTone } from "@/frontend/components/ui/Badge";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

// Bands agreed in the plan: 🟢 High ≥85, 🟡 Review 60–84, 🔴 Low <60.
function band(score: number): { tone: BadgeTone; labelKey: string; Icon: typeof ShieldCheck } {
  if (score >= 85) return { tone: "green", labelKey: "labReportsAi.confHigh", Icon: ShieldCheck };
  if (score >= 60) return { tone: "amber", labelKey: "labReportsAi.confReview", Icon: ShieldAlert };
  return { tone: "red", labelKey: "labReportsAi.confLow", Icon: ShieldX };
}

/** Confidence pill: percentage + band label (never colour alone). */
export function ConfidenceBadge({
  score,
  showLabel = true
}: {
  score: number;
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const { tone, labelKey, Icon } = band(score);
  return (
    <Badge tone={tone} className="gap-1">
      <Icon size={12} />
      {score}%{showLabel ? ` · ${t(labelKey)}` : ""}
    </Badge>
  );
}
