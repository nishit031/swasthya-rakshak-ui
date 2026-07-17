"use client";

import { useLanguage } from "@/frontend/components/providers/LanguageContext";
import { cn } from "./cn";

/** EN ⇄ हिं language switch. Label shows the language you'll switch TO. */
export function LanguageToggle({ className }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      onClick={toggleLanguage}
      aria-label="Toggle language"
      className={cn(
        "rounded-md px-3 py-1 text-sm font-semibold transition-colors",
        "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        className
      )}
    >
      {language === "en" ? "हिं" : "EN"}
    </button>
  );
}
