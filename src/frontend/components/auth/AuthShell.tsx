"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, FileText, FlaskConical, Heart, Pill } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { ThemeToggle } from "@/frontend/components/ui/ThemeToggle";
import { LanguageToggle } from "@/frontend/components/ui/LanguageToggle";

const FEATURES = [
  { icon: FileText, key: "records" },
  { icon: Pill, key: "prescriptions" },
  { icon: FlaskConical, key: "labReports" },
  { icon: Bell, key: "reminders" }
] as const;

/** Two-panel auth layout: branding gradient on the left, a glass form card on the right. */
export function AuthShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Branding panel */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-500 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <Link href="/" className="relative flex items-center gap-2">
          <Heart size={28} fill="rgba(255,255,255,0.2)" />
          <span className="text-xl font-bold">स्वास्थ्य रक्षक</span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">{t("hero.titleLead")}</h2>
          <p className="mt-2 text-primary-100">{t("hero.tagline")}</p>

          <div className="mt-10 flex flex-col gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.key}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 * i, duration: 0.4 }}
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <f.icon size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t(`features.items.${f.key}.title`)}</p>
                  <p className="text-sm text-primary-100">
                    {t(`features.items.${f.key}.description`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-100/70">{t("footer.disclaimer")}</p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <motion.div
          className="glass-card w-full max-w-md p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
          <div className="flex flex-col gap-5">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
