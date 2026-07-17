"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { translations, type Language } from "@/frontend/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  /** Translate a dot-path key, e.g. t("nav.home"). Falls back to English, then the key. */
  t: (key: string) => string;
  /** Like t() but interpolates {placeholders}. */
  formatMessage: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "preferred-language";

function resolve(lang: Language, key: string): string {
  const parts = key.split(".");
  const dig = (root: unknown): string | undefined => {
    let value: unknown = root;
    for (const part of parts) {
      if (value && typeof value === "object" && part in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return typeof value === "string" ? value : undefined;
  };
  return dig(translations[lang]) ?? dig(translations.en) ?? key;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === "en" || stored === "hi") setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "hi" : "en");
  }, [language, setLanguage]);

  const t = useCallback((key: string) => resolve(language, key), [language]);

  const formatMessage = useCallback(
    (key: string, params: Record<string, string | number> = {}) => {
      let message = resolve(language, key);
      for (const [k, v] of Object.entries(params)) {
        message = message.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
      return message;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, formatMessage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

/** Convenience hook matching the friend's API: returns { t, formatMessage, language }. */
export function useTranslation() {
  const { t, formatMessage, language } = useLanguage();
  return { t, formatMessage, language };
}
