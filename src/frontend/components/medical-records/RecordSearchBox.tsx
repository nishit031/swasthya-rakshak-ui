"use client";

// Instant search box with recent searches + suggestions (Phase 7A §4). Medical-Records-scoped only
// — it just controls `value`/`onChange`; the page still owns debouncing and the actual fetch.

import { useEffect, useRef, useState } from "react";
import { Search, X, Clock } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Input } from "@/frontend/components/ui/Field";
import { MEDICAL_DOC_TYPES } from "@/backend/features/medical-records/document-types";
import { getRecentSearches } from "@/backend/features/medical-records/recent-searches";

export function RecordSearchBox({
  value,
  onChange,
  onSubmit
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
}) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointer(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  const typeSuggestions = value.trim()
    ? MEDICAL_DOC_TYPES.filter((d) =>
        t(`medicalRecordTypes.${d.key}`).toLowerCase().includes(value.trim().toLowerCase())
      ).slice(0, 4)
    : [];

  const showDropdown = focused && (recent.length > 0 || typeSuggestions.length > 0);

  function pick(term: string) {
    onChange(term);
    onSubmit(term);
    setFocused(false);
  }

  return (
    <div ref={wrapRef} className="relative max-w-sm">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setRecent(getRecentSearches());
          setFocused(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") pick(value);
          if (e.key === "Escape") setFocused(false);
        }}
        placeholder={t("medicalRecordsAi.searchPlaceholder")}
        aria-label={t("medicalRecordsAi.searchPlaceholder")}
        wrapClassName="mb-0"
        className="pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("common.cancel")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:hover:text-gray-300"
        >
          <X size={15} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {recent.length > 0 && (
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("medicalRecordsAi.recentSearches")}
            </div>
          )}
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => pick(term)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Clock size={13} className="text-gray-400" />
              {term}
            </button>
          ))}
          {typeSuggestions.length > 0 && (
            <div className="mt-1 border-t border-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:text-gray-500">
              {t("medicalRecordsAi.suggestions")}
            </div>
          )}
          {typeSuggestions.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => pick(t(`medicalRecordTypes.${d.key}`))}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Search size={13} className="text-gray-400" />
              {t(`medicalRecordTypes.${d.key}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
