"use client";

// Sidebar sub-list of saved Medical Records filter views (Phase 7A §3). Refetches on the
// `sr:saved-views-changed` window event, dispatched by the Medical Records page after a
// save/delete — a plain DOM event is enough for one small cross-component refresh, no global
// state store needed.

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { toRoute } from "@/backend/lib/routes";
import { serializeFilters } from "@/backend/features/medical-records/filters";
import type { SavedView } from "@/backend/features/saved-views/saved-views.types";

export const SAVED_VIEWS_CHANGED_EVENT = "sr:saved-views-changed";

export function SavedViewsNav() {
  const [views, setViews] = useState<SavedView[]>([]);

  useEffect(() => {
    function load() {
      apiFetch<SavedView[]>("/saved-views").then((res) => {
        if (res.success) setViews(res.data ?? []);
      });
    }
    load();
    window.addEventListener(SAVED_VIEWS_CHANGED_EVENT, load);
    return () => window.removeEventListener(SAVED_VIEWS_CHANGED_EVENT, load);
  }, []);

  async function remove(id: string) {
    await apiFetch(`/saved-views/${id}`, { method: "DELETE" });
    setViews((v) => v.filter((view) => view.id !== id));
  }

  if (views.length === 0) return null;

  return (
    <div className="ml-8 flex flex-col gap-0.5 border-l border-gray-200 py-1 pl-3 dark:border-gray-800">
      {views.map((v) => {
        const qs = serializeFilters(v.filterJson).toString();
        return (
          <div key={v.id} className="group flex items-center justify-between gap-1">
            <Link
              href={toRoute(qs ? `/medical-records?${qs}` : "/medical-records")}
              className="truncate rounded px-1.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
              title={v.name}
            >
              {v.name}
            </Link>
            <button
              type="button"
              onClick={() => remove(v.id)}
              aria-label={`Remove ${v.name}`}
              className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-error-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-gray-600"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
