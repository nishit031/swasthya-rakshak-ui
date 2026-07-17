"use client";

// Persists the Medical Records list filters in the URL query string — greenfield in this app (no
// other page reads/writes useSearchParams yet), so filters are shareable and survive back/forward.

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toRoute } from "@/backend/lib/routes";
import { parseFilters, serializeFilters, type MedicalRecordFilters } from "./filters";

export function useRecordFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<MedicalRecordFilters>) => {
      const next = serializeFilters({ ...filters, ...patch });
      const qs = next.toString();
      router.replace(toRoute(qs ? `${pathname}?${qs}` : pathname));
    },
    [filters, pathname, router]
  );

  const replaceFilters = useCallback(
    (next: MedicalRecordFilters) => {
      const qs = serializeFilters(next).toString();
      router.replace(toRoute(qs ? `${pathname}?${qs}` : pathname));
    },
    [pathname, router]
  );

  const resetFilters = useCallback(() => {
    router.replace(toRoute(pathname));
  }, [pathname, router]);

  return { filters, setFilters, replaceFilters, resetFilters };
}
