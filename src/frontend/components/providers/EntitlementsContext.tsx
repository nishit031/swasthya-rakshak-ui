"use client";

import { createContext, useContext, useMemo } from "react";
import type { Entitlements } from "@/backend/features/auth/auth.types";

const FREE_ENTITLEMENTS: Entitlements = {
  planCode: "free",
  status: "none",
  features: [],
  periodEnd: null,
  memberCount: 1
};

interface EntitlementsContextValue {
  entitlements: Entitlements;
  hasFeature: (feature: string) => boolean;
  /** Re-fetches /auth/me so the dashboard reflects a plan change right after checkout. */
  refresh: () => Promise<void>;
}

const EntitlementsContext = createContext<EntitlementsContextValue>({
  entitlements: FREE_ENTITLEMENTS,
  hasFeature: () => false,
  refresh: async () => {}
});

// Wraps the dashboard with the plan/feature snapshot that /auth/me already returned —
// no extra request on mount. `onRefresh` (supplied by the layout, which owns the user
// fetch) lets a child page like /pricing pull a fresh snapshot right after checkout.
export function EntitlementsProvider({
  entitlements,
  onRefresh,
  children
}: {
  entitlements: Entitlements | undefined;
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const value = useMemo<EntitlementsContextValue>(() => {
    const resolved = entitlements ?? FREE_ENTITLEMENTS;
    return {
      entitlements: resolved,
      hasFeature: (feature) => resolved.features.includes(feature),
      refresh: onRefresh
    };
  }, [entitlements, onRefresh]);

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  return useContext(EntitlementsContext);
}
