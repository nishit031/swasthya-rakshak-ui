import { GlassCard } from "@/frontend/components/ui/GlassCard";

/** Pulsing placeholder matching LabReportCard's layout, shown while the list is loading. */
export function LabReportCardSkeleton() {
  return (
    <GlassCard className="flex flex-col gap-4" aria-hidden>
      <div className="flex items-start gap-4">
        <div className="h-14 w-11 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="min-w-0 flex-1 space-y-2 py-0.5">
          <div className="h-4 w-2/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </GlassCard>
  );
}
