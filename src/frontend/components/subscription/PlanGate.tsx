"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useEntitlements } from "@/frontend/components/providers/EntitlementsContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

interface PlanGateProps {
  /** Feature key from PlanFeatures on the backend, e.g. "health_trends". */
  feature: string;
  /** Plan name to suggest in the copy, e.g. "Individual Premium" or "Family Premium". */
  requiredPlanLabel: string;
  children: React.ReactNode;
}

/** Wraps a premium-only page/section. Renders the upsell card instead of children until
 *  the signed-in user's entitlements include `feature` — mirrors requireEntitlement() on
 *  the backend so a locked-out user never even calls the gated endpoint. */
export function PlanGate({ feature, requiredPlanLabel, children }: PlanGateProps) {
  const { hasFeature } = useEntitlements();
  const { formatMessage, t } = useTranslation();

  if (hasFeature(feature)) return <>{children}</>;

  return (
    <GlassCard className="flex flex-col items-center gap-4 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
        <Lock size={26} />
      </span>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {t("subscription.gate.title")}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {formatMessage("subscription.gate.description", { plan: requiredPlanLabel })}
        </p>
      </div>
      <Link href="/pricing">
        <Button variant="primary">{t("subscription.gate.cta")}</Button>
      </Link>
    </GlassCard>
  );
}
